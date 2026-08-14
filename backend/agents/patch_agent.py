"""
Real patch pipeline: apply an uploaded patch to a scratch copy of the
kernel source, build it, boot it under QEMU, run the benchmarks, and
compare against the already-captured baseline.

Runs entirely inside one disposable container (--rm): the patch is
applied to a /tmp copy made *inside* the container, never to the
canonical kernel-sprint-src volume other pages/scripts rely on, so a
bad or malicious patch can't corrupt the shared source tree -- worst
case the container's build/boot fails and gets thrown away.
"""
import json
import shutil
import subprocess
import uuid
from pathlib import Path

from agents.docker_env import docker_env
from agents.qemu_agent import IMAGE, REPO_ROOT, STAGE_RE, parse_benchmark_output

# Colima only shares paths under the home directory into the VM via
# virtiofs -- macOS's default tempfile.TemporaryDirectory() lands under
# /var/folders/..., which the container can't see. Use a scratch dir
# inside the repo (which IS shared) instead.
SCRATCH_ROOT = REPO_ROOT / ".patch-scratch"

MAX_PATCH_BYTES = 200_000
PIPELINE_TIMEOUT_SEC = 900  # 15 minutes ceiling for apply+build+boot

RESULTS_FILE = Path(__file__).resolve().parent.parent / "data" / "results.json"

PIPELINE_SCRIPT = r"""
set -e
echo '@@STAGE:apply:start@@'
mkdir -p /tmp/custom-src
cp -r /kernel/. /tmp/custom-src/
cd /tmp/custom-src
# /kernel's checked-out branch may itself already have the project's own
# scheduler patch committed (see kernel-sprint-cfs-optimization) -- reset
# to the pristine tagged baseline so uploaded patches always apply
# against the same unpatched source as results/baseline/, regardless of
# what's since been committed on top.
git reset --hard v6.6.151 >/dev/null
git apply --check /patch/patch.diff
git apply /patch/patch.diff
echo '@@STAGE:apply:done@@'

echo '@@STAGE:build:start@@'
make ARCH=arm64 O=/tmp/custom-build defconfig >/dev/null
cd /tmp/custom-build
/tmp/custom-src/scripts/config --disable DEBUG_INFO --disable DEBUG_INFO_DWARF4 --disable DEBUG_INFO_DWARF5 --disable DEBUG_INFO_BTF
make ARCH=arm64 -C /tmp/custom-src O=/tmp/custom-build olddefconfig >/dev/null
make ARCH=arm64 -C /tmp/custom-src O=/tmp/custom-build -j4 Image
echo '@@STAGE:build:done@@'

echo '@@STAGE:boot:start@@'
mkdir -p /tmp/initramfs/bin
cp /workspace/scripts/initramfs-staging/init /tmp/initramfs/init
gcc -O2 -static -o /tmp/initramfs/bin/process_creation /workspace/benchmark/process_creation.c
gcc -O2 -static -o /tmp/initramfs/bin/context_switch /workspace/benchmark/context_switch.c
gcc -O2 -static -o /tmp/initramfs/bin/scheduler_latency /workspace/benchmark/scheduler_latency.c -lpthread
cp /bin/busybox /tmp/initramfs/bin/busybox
chmod +x /tmp/initramfs/init /tmp/initramfs/bin/*
cd /tmp/initramfs && find . | cpio -o -H newc 2>/dev/null | gzip > /tmp/initramfs.cpio.gz
timeout 120 qemu-system-aarch64 \
  -M virt -cpu max -smp 4 -m 1024 \
  -kernel /tmp/custom-build/arch/arm64/boot/Image \
  -initrd /tmp/initramfs.cpio.gz \
  -append 'console=ttyAMA0 rdinit=/init panic=1' \
  -nographic -no-reboot
echo '@@STAGE:boot:done@@'
"""


def _extract_apply_error(text: str) -> str:
    lines = [l for l in text.splitlines() if "error:" in l.lower()]
    return lines[0] if lines else "patch did not apply cleanly (git apply rejected it)"


def _pct_change(baseline: float, value: float) -> float:
    return ((value - baseline) / baseline) * 100


def run_patch_pipeline(patch_text: str):
    if not patch_text.strip():
        yield {"type": "error", "message": "empty patch"}
        return
    if len(patch_text.encode()) > MAX_PATCH_BYTES:
        yield {"type": "error", "message": f"patch too large (max {MAX_PATCH_BYTES} bytes)"}
        return

    SCRATCH_ROOT.mkdir(exist_ok=True)
    tmpdir = SCRATCH_ROOT / uuid.uuid4().hex
    tmpdir.mkdir()
    try:
        (tmpdir / "patch.diff").write_text(patch_text)

        argv = [
            "docker", "run", "--rm",
            "-v", "kernel-sprint-src:/kernel:ro",
            "-v", f"{REPO_ROOT}:/workspace:ro",
            "-v", f"{tmpdir}:/patch:ro",
            IMAGE, "bash", "-c", PIPELINE_SCRIPT,
        ]

        proc = subprocess.Popen(
            argv, env=docker_env(), stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, bufsize=1,
        )

        full_output = []
        try:
            for line in proc.stdout:
                full_output.append(line)
                stage_match = STAGE_RE.search(line)
                if stage_match:
                    yield {"type": "stage", "stage": stage_match.group(1), "status": stage_match.group(2)}
                else:
                    yield {"type": "output", "line": line}
            proc.wait(timeout=PIPELINE_TIMEOUT_SEC)
        except subprocess.TimeoutExpired:
            proc.kill()
            yield {"type": "error", "message": f"pipeline exceeded {PIPELINE_TIMEOUT_SEC}s time limit"}
            return

        text = "".join(full_output)

        if proc.returncode != 0:
            if "@@STAGE:apply:done@@" not in text:
                yield {"type": "error", "stage": "apply", "message": _extract_apply_error(text)}
            elif "@@STAGE:build:done@@" not in text:
                yield {"type": "error", "stage": "build", "message": f"kernel build failed (exit {proc.returncode})"}
            else:
                yield {"type": "error", "stage": "boot", "message": f"boot/benchmark failed (exit {proc.returncode})"}
            return

        yield {"type": "stage", "stage": "compare", "status": "start"}
        result = parse_benchmark_output(text)
        baseline = json.loads(RESULTS_FILE.read_text())["baseline"]

        comparison = {}
        if "scheduler_latency" in result and "p99_us" in result["scheduler_latency"]:
            comparison["scheduler_latency_p99_pct_change"] = round(
                _pct_change(baseline["scheduler_latency"]["p99_us"], result["scheduler_latency"]["p99_us"]), 2
            )
        if "process_creation" in result and "mean_us" in result["process_creation"]:
            comparison["process_creation_mean_pct_change"] = round(
                _pct_change(baseline["process_creation"]["mean_us"], result["process_creation"]["mean_us"]), 2
            )
        if "context_switch" in result and "switches_per_sec" in result["context_switch"]:
            comparison["context_switch_pct_change"] = round(
                _pct_change(baseline["context_switch"]["switches_per_sec"], result["context_switch"]["switches_per_sec"]), 2
            )
        yield {"type": "stage", "stage": "compare", "status": "done"}

        yield {"type": "stage", "stage": "report", "status": "start"}
        yield {
            "type": "result",
            "data": result,
            "comparison_vs_baseline": comparison,
            "note": "Single run against the pre-captured baseline average (3 runs) -- expect more "
                    "run-to-run variance than the 3-run comparisons on the main dashboard. Avoid "
                    "running other CPU-heavy work on this machine while a pipeline run is in "
                    "progress: the QEMU guest's vCPUs share physical cores with the host, so host "
                    "load shows up as scheduler_latency noise that has nothing to do with the "
                    "patch (observed once: a concurrent `npm run build` inflated p99 to 130ms vs "
                    "an isolated re-run's 3.9ms for the identical patch).",
        }
        yield {"type": "stage", "stage": "report", "status": "done"}
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
