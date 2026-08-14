"""
Real, sandboxed failure injection. Every action here runs only inside
the disposable kernel-sprint-lab container -- stress-ng, tc netem, and
kill all operate purely within the container's own cgroup/PID/network
namespace, never against the host, so a chaos-testing page can exist
without being able to touch the actual machine it runs on.

"Detection"/"recommendation" below are simple fixed thresholds, not a
trained model or LLM call -- labeled "automated" rather than "AI" in
the API and UI to avoid overclaiming what a couple of if-statements do.
"""
import subprocess
import time

from agents.docker_agent import CONTAINER
from agents.docker_env import docker_env
from agents.ebpf_agent import read_cpu_stat, read_memory_pct

CPU_HIGH_THRESHOLD_PCT = 70
MEM_HIGH_THRESHOLD_PCT = 80
MAX_DURATION_SEC = 20
DISK_STRESS_BYTES = "32M"  # small and bounded -- host disk is limited


def _exec(argv: list[str], timeout: int = 15) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["docker", "exec", CONTAINER] + argv,
        env=docker_env(), capture_output=True, text=True, timeout=timeout,
    )


def cpu_stress(load_pct: int, duration_sec: int):
    load_pct = max(1, min(100, load_pct))
    duration_sec = max(1, min(MAX_DURATION_SEC, duration_sec))
    ncpus = int(_exec(["nproc"]).stdout.strip() or "4")

    yield {"type": "start", "action": "cpu", "load_pct": load_pct, "duration_sec": duration_sec}

    proc = subprocess.Popen(
        ["docker", "exec", CONTAINER, "stress-ng", "--cpu", str(ncpus),
         "--cpu-load", str(load_pct), "--timeout", f"{duration_sec}s"],
        env=docker_env(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    samples = []
    start = time.time()
    while time.time() - start < duration_sec + 1 and proc.poll() is None:
        idle0, total0 = read_cpu_stat()
        time.sleep(1)
        idle1, total1 = read_cpu_stat()
        total_delta = total1 - total0
        cpu_pct = round(100 * (1 - (idle1 - idle0) / total_delta), 1) if total_delta > 0 else 0.0
        samples.append(cpu_pct)
        yield {"type": "sample", "cpu_pct": cpu_pct}

    proc.wait(timeout=5)

    peak = max(samples) if samples else 0.0
    detected = peak >= CPU_HIGH_THRESHOLD_PCT
    yield {
        "type": "result",
        "peak_cpu_pct": peak,
        "detected": detected,
        "detection_message": (
            f"High CPU detected ({peak:.1f}% >= {CPU_HIGH_THRESHOLD_PCT}% threshold)"
            if detected else f"CPU stayed below the {CPU_HIGH_THRESHOLD_PCT}% threshold"
        ),
        "recommendation": (
            "A shorter sysctl_sched_base_slice (see the patch pipeline) improves "
            "wake-up latency for other tasks while a CPU hog like this is running."
            if detected else "No action needed."
        ),
    }


def memory_stress(pct: int, duration_sec: int):
    pct = max(1, min(90, pct))  # cap well under 100 -- this is real memory pressure on the VM
    duration_sec = max(1, min(MAX_DURATION_SEC, duration_sec))

    yield {"type": "start", "action": "memory", "pct": pct, "duration_sec": duration_sec}

    proc = subprocess.Popen(
        ["docker", "exec", CONTAINER, "stress-ng", "--vm", "1", "--vm-bytes", f"{pct}%",
         "--timeout", f"{duration_sec}s"],
        env=docker_env(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    samples = []
    start = time.time()
    while time.time() - start < duration_sec + 1 and proc.poll() is None:
        mem_pct = read_memory_pct()
        if mem_pct is not None:
            samples.append(mem_pct)
            yield {"type": "sample", "memory_pct": mem_pct}
        time.sleep(1)

    proc.wait(timeout=5)

    peak = max(samples) if samples else 0.0
    detected = peak >= MEM_HIGH_THRESHOLD_PCT
    yield {
        "type": "result",
        "peak_memory_pct": peak,
        "detected": detected,
        "detection_message": (
            f"High memory pressure detected ({peak:.1f}% >= {MEM_HIGH_THRESHOLD_PCT}% threshold)"
            if detected else f"Memory stayed below the {MEM_HIGH_THRESHOLD_PCT}% threshold"
        ),
        "recommendation": (
            "Sustained memory pressure like this can trigger reclaim/OOM paths -- "
            "worth checking dmesg for oom-killer activity after real workloads."
            if detected else "No action needed."
        ),
    }


def disk_stress(duration_sec: int):
    duration_sec = max(1, min(MAX_DURATION_SEC, duration_sec))
    yield {"type": "start", "action": "disk", "duration_sec": duration_sec}

    result = subprocess.run(
        ["docker", "exec", CONTAINER, "stress-ng", "--hdd", "1",
         "--hdd-bytes", DISK_STRESS_BYTES, "--timeout", f"{duration_sec}s", "-v"],
        env=docker_env(), capture_output=True, text=True, timeout=duration_sec + 10,
    )

    yield {
        "type": "result",
        "output": (result.stdout + result.stderr).strip(),
        "detected": result.returncode == 0,
        "detection_message": "Disk stress completed" if result.returncode == 0 else "Disk stress failed to run",
        "recommendation": f"Wrote/read bounded {DISK_STRESS_BYTES} within the container's own "
                           "ephemeral filesystem -- no host disk impact.",
    }


def network_delay(delay_ms: int, duration_sec: int):
    delay_ms = max(1, min(2000, delay_ms))
    duration_sec = max(1, min(MAX_DURATION_SEC, duration_sec))

    yield {"type": "start", "action": "network", "delay_ms": delay_ms, "duration_sec": duration_sec}

    add = _exec(["tc", "qdisc", "add", "dev", "eth0", "root", "netem", "delay", f"{delay_ms}ms"], timeout=10)
    if add.returncode != 0:
        yield {"type": "result", "detected": False,
               "detection_message": "failed to apply network delay",
               "recommendation": add.stderr.strip()}
        return

    try:
        time.sleep(duration_sec)
    finally:
        # always remove, even if something above raised -- never leave
        # the container's network permanently degraded
        _exec(["tc", "qdisc", "del", "dev", "eth0", "root", "netem"], timeout=10)

    yield {
        "type": "result",
        "detected": True,
        "detection_message": f"{delay_ms}ms delay applied to the container's eth0 for {duration_sec}s, then removed",
        "recommendation": "Scoped to the container's own interface only -- host networking was never touched.",
    }


def kill_process_demo():
    """Spawns a demo process inside the container, then kills it -- both
    operations are confined to the container's own PID namespace."""
    yield {"type": "start", "action": "kill"}

    spawn = _exec(["bash", "-c", "sleep 120 & echo $!"], timeout=5)
    pid = spawn.stdout.strip()
    if not pid.isdigit():
        yield {"type": "result", "detected": False,
               "detection_message": "failed to spawn demo process",
               "recommendation": spawn.stderr.strip()}
        return

    yield {"type": "sample", "message": f"spawned demo process pid={pid} inside the sandbox"}
    time.sleep(1)

    _exec(["kill", "-9", pid], timeout=5)
    time.sleep(0.5)
    # This container's PID 1 is `sleep infinity`, not a real init, so a
    # killed process becomes a zombie (state Z) rather than being
    # reaped -- `kill -0` still succeeds against a zombie's PID entry,
    # so check process state instead of just existence.
    check = _exec(["sh", "-c", f"ps -o stat= -p {pid} 2>/dev/null || echo gone"], timeout=5)
    state = check.stdout.strip()
    killed = state == "gone" or state.startswith("Z")

    yield {
        "type": "result",
        "pid": pid,
        "detected": killed,
        "detection_message": f"process {pid} confirmed killed" if killed else f"process {pid} still alive (unexpected)",
        "recommendation": "Only ever affects processes inside this container's own PID namespace -- "
                           "Docker isolates it from the host regardless of --privileged.",
    }
