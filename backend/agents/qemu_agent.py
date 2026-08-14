"""
Runs the real benchmark pipeline on demand: compiles the three
benchmark binaries fresh, boots the requested kernel image (already
built by the kernel project -- see ../../scripts/env.sh and
../../results/) under qemu-system-aarch64, and parses the real output.

This reuses the exact same kernel images and QEMU invocation as
scripts/run-benchmarks-in-guest.sh, just broken into stages (via
sentinel markers in the container's stdout) so the web UI can show
live compile/boot/execute/collect progress instead of a single opaque
blocking call.
"""
import re
import subprocess
from pathlib import Path

from agents.docker_env import docker_env

IMAGE = "kernel-sprint-env"
REPO_ROOT = Path(__file__).resolve().parent.parent.parent

BUILD_VOLUMES = {
    "baseline": "kernel-sprint-build-baseline",
    "optimized": "kernel-sprint-build-optimized",
}

STAGE_RE = re.compile(r"@@STAGE:(\w+):(\w+)@@")

PIPELINE_SCRIPT = r"""
set -e
echo '@@STAGE:compile:start@@'
mkdir -p /tmp/initramfs/bin
cp /workspace/scripts/initramfs-staging/init /tmp/initramfs/init
gcc -O2 -static -o /tmp/initramfs/bin/process_creation /workspace/benchmark/process_creation.c
gcc -O2 -static -o /tmp/initramfs/bin/context_switch /workspace/benchmark/context_switch.c
gcc -O2 -static -o /tmp/initramfs/bin/scheduler_latency /workspace/benchmark/scheduler_latency.c -lpthread
cp /bin/busybox /tmp/initramfs/bin/busybox
chmod +x /tmp/initramfs/init /tmp/initramfs/bin/*
cd /tmp/initramfs && find . | cpio -o -H newc 2>/dev/null | gzip > /tmp/initramfs.cpio.gz
echo '@@STAGE:compile:done@@'
echo '@@STAGE:boot:start@@'
timeout 90 qemu-system-aarch64 \
  -M virt -cpu max -smp 4 -m 1024 \
  -kernel /build/arch/arm64/boot/Image \
  -initrd /tmp/initramfs.cpio.gz \
  -append 'console=ttyAMA0 rdinit=/init panic=1' \
  -nographic -no-reboot
echo '@@STAGE:boot:done@@'
"""


def parse_benchmark_output(text: str) -> dict:
    result = {}

    m = re.search(
        r"benchmark=process_creation.*?\n"
        r"mean_us=([\d.]+) min_us=([\d.]+) max_us=([\d.]+) p50_us=([\d.]+) p99_us=([\d.]+)",
        text,
    )
    if m:
        result["process_creation"] = {
            "mean_us": float(m.group(1)), "min_us": float(m.group(2)),
            "max_us": float(m.group(3)), "p50_us": float(m.group(4)), "p99_us": float(m.group(5)),
        }

    m = re.search(
        r"round_trip_us=([\d.]+) context_switch_us=([\d.]+) context_switches_per_sec=([\d.]+)",
        text,
    )
    if m:
        result["context_switch"] = {
            "round_trip_us": float(m.group(1)), "per_switch_us": float(m.group(2)),
            "switches_per_sec": float(m.group(3)),
        }

    m = re.search(
        r"benchmark=scheduler_latency.*?\n"
        r"mean_us=([\d.]+) min_us=([\d.]+) max_us=([\d.]+) p50_us=([\d.]+) p99_us=([\d.]+)",
        text,
    )
    if m:
        result["scheduler_latency"] = {
            "mean_us": float(m.group(1)), "min_us": float(m.group(2)),
            "max_us": float(m.group(3)), "p50_us": float(m.group(4)), "p99_us": float(m.group(5)),
        }

    return result


def run_benchmark_pipeline(kernel: str):
    """Yields dicts describing pipeline progress, ending with the parsed result."""
    if kernel not in BUILD_VOLUMES:
        yield {"type": "error", "message": f"unknown kernel '{kernel}', expected 'baseline' or 'optimized'"}
        return

    argv = [
        "docker", "run", "--rm",
        "-v", f"{BUILD_VOLUMES[kernel]}:/build",
        "-v", f"{REPO_ROOT}:/workspace:ro",
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
        proc.wait(timeout=120)
    except subprocess.TimeoutExpired:
        proc.kill()
        yield {"type": "error", "message": "pipeline exceeded time limit"}
        return

    result = parse_benchmark_output("".join(full_output))
    yield {"type": "result", "kernel": kernel, "data": result}
