"""
Real eBPF kernel monitoring via bpftrace, attached to sched:sched_switch
and sched:sched_wakeup tracepoints inside the sandboxed lab container.
Paired each second with real CPU%/memory%/process data from /proc, all
read from the container -- nothing here is synthetic.
"""
import re
import subprocess

from agents.docker_agent import CONTAINER
from agents.docker_env import docker_env

BPFTRACE_SCRIPT = (
    'tracepoint:sched:sched_switch { @switches = count(); } '
    'tracepoint:sched:sched_wakeup { @wakeups = count(); } '
    'interval:s:1 { '
    'print(@switches); print(@wakeups); '
    'clear(@switches); clear(@wakeups); '
    '}'
)

# bpftrace's printf() rejects count()-map values directly ("expects a
# value of type integer (count supplied)") and doesn't support casting
# them either -- print() is the only way to get a count map's value
# out, and it prints "@switches: N" on its own line, not combined with
# other values in one printf. So each interval tick arrives as two
# separate lines, in this order.
SWITCHES_RE = re.compile(r"@switches: (\d+)")
WAKEUPS_RE = re.compile(r"@wakeups: (\d+)")


def _exec(argv: list[str], timeout: int = 5) -> str:
    result = subprocess.run(
        ["docker", "exec", CONTAINER] + argv,
        env=docker_env(), capture_output=True, text=True, timeout=timeout,
    )
    return result.stdout


def _read_cpu_stat():
    line = _exec(["cat", "/proc/stat"]).splitlines()[0]
    parts = [int(x) for x in line.split()[1:]]
    idle = parts[3] + (parts[4] if len(parts) > 4 else 0)
    total = sum(parts)
    return idle, total


def _read_memory_pct():
    out = _exec(["sh", "-c", "free | awk '/Mem:/{printf \"%.1f\", $3/$2*100}'"]).strip()
    try:
        return float(out)
    except ValueError:
        return None


def _read_top_processes(n: int = 5):
    out = _exec(["ps", "-eo", "pid,comm,pcpu,pmem", "--sort=-pcpu"])
    lines = out.strip().splitlines()[1 : n + 1]
    processes = []
    for line in lines:
        parts = line.split(None, 3)
        if len(parts) >= 4:
            processes.append({"pid": parts[0], "name": parts[1], "cpu": parts[2], "mem": parts[3]})
    return processes


def stream_metrics(stop_event):
    """
    Yields one real metrics dict per second until stop_event is set.
    Caller is responsible for killing the bpftrace subprocess by
    setting stop_event (this function stops reading and returns once
    it is set, and kills its own subprocess in `finally`).
    """
    argv = ["docker", "exec", CONTAINER, "bpftrace", "-e", BPFTRACE_SCRIPT]
    proc = subprocess.Popen(
        argv, env=docker_env(), stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, bufsize=1,
    )

    prev_idle, prev_total = _read_cpu_stat()
    pending_switches = None
    try:
        for line in proc.stdout:
            if stop_event.is_set():
                break

            switches_match = SWITCHES_RE.search(line)
            if switches_match:
                pending_switches = int(switches_match.group(1))
                continue

            wakeups_match = WAKEUPS_RE.search(line)
            if not wakeups_match or pending_switches is None:
                continue

            wakeups = int(wakeups_match.group(1))

            idle, total = _read_cpu_stat()
            idle_delta = idle - prev_idle
            total_delta = total - prev_total
            cpu_pct = round(100 * (1 - idle_delta / total_delta), 1) if total_delta > 0 else 0.0
            prev_idle, prev_total = idle, total

            yield {
                "context_switches_per_sec": pending_switches,
                "wakeups_per_sec": wakeups,
                "cpu_pct": cpu_pct,
                "memory_pct": _read_memory_pct(),
                "processes": _read_top_processes(),
            }
            pending_switches = None
    finally:
        proc.kill()
