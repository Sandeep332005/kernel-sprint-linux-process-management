"""
Real, parameterized experiments run against the sandbox container's
own host kernel (fast -- seconds, not the minutes a full QEMU boot
takes). Only the scheduler optimization test has a genuine before/
after: it's the one experiment with an actual live-tunable knob
(base_slice_ns, the same mechanism as the committed kernel patch, but
toggleable at runtime on this kernel via debugfs, no rebuild needed).
The others report a single real measurement, parameterized by the
user's input -- they are NOT forced into a fabricated before/after
shape just to match a template.
"""
import re
import subprocess

from agents.docker_agent import CONTAINER
from agents.docker_env import docker_env

BASE_SLICE_PATH = "/sys/kernel/debug/sched/base_slice_ns"


def _exec(argv: list[str], timeout: int = 30) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["docker", "exec", CONTAINER] + argv,
        env=docker_env(), capture_output=True, text=True, timeout=timeout,
    )


def _compile(src: str, out: str, extra_flags: list[str] | None = None) -> subprocess.CompletedProcess:
    argv = ["gcc", "-O2", "-o", out, f"/workspace/benchmark/{src}"] + (extra_flags or [])
    return _exec(argv, timeout=30)


def _read_base_slice() -> int:
    return int(_exec(["cat", BASE_SLICE_PATH]).stdout.strip())


def _write_base_slice(value: int) -> None:
    _exec(["sh", "-c", f"echo {value} > {BASE_SLICE_PATH}"])


def scheduler_optimization_test(iterations: int):
    # "iterations" of the wake-up latency probe, not a process count --
    # scheduler_latency.c's actual contention comes from a fixed number
    # of CPU-hog threads (one per core), not a user-configurable count.
    iterations = max(50, min(5000, iterations))
    yield {"type": "start", "test": "scheduler_optimization"}

    compile_result = _compile("scheduler_latency.c", "/tmp/exp_scheduler_latency", ["-lpthread"])
    if compile_result.returncode != 0:
        yield {"type": "error", "message": compile_result.stderr}
        return

    original = _read_base_slice()
    try:
        yield {"type": "sample", "phase": "before", "base_slice_ns": original}
        before = _exec(["/tmp/exp_scheduler_latency", str(iterations), "2000"], timeout=60).stdout
        before_metrics = _parse_latency(before)
        yield {"type": "sample", "phase": "before", "result": before_metrics}

        reduced = original // 3
        _write_base_slice(reduced)
        yield {"type": "sample", "phase": "after", "base_slice_ns": reduced}
        after = _exec(["/tmp/exp_scheduler_latency", str(iterations), "2000"], timeout=60).stdout
        after_metrics = _parse_latency(after)
        yield {"type": "sample", "phase": "after", "result": after_metrics}
    finally:
        _write_base_slice(original)  # always restore -- never leave the sandbox's live kernel mutated

    improvement = None
    if before_metrics.get("p99_us") and after_metrics.get("p99_us"):
        improvement = round(
            (before_metrics["p99_us"] - after_metrics["p99_us"]) / before_metrics["p99_us"] * 100, 1
        )

    yield {
        "type": "result",
        "before": before_metrics,
        "after": after_metrics,
        "p99_improvement_pct": improvement,
        "note": f"base_slice_ns temporarily reduced {original} -> {reduced} on this container's live "
                "kernel for the 'after' run, then restored -- same mechanism as patches/scheduler-optimization.patch.",
    }


def process_creation_test(iterations: int):
    iterations = max(100, min(20000, iterations))
    yield {"type": "start", "test": "process_creation"}

    compile_result = _compile("process_creation.c", "/tmp/exp_process_creation")
    if compile_result.returncode != 0:
        yield {"type": "error", "message": compile_result.stderr}
        return

    out = _exec(["/tmp/exp_process_creation", str(iterations)], timeout=60).stdout
    yield {"type": "result", "iterations": iterations, "result": _parse_latency(out)}


def context_switch_test(round_trips: int):
    round_trips = max(1000, min(200000, round_trips))
    yield {"type": "start", "test": "context_switch"}

    compile_result = _compile("context_switch.c", "/tmp/exp_context_switch")
    if compile_result.returncode != 0:
        yield {"type": "error", "message": compile_result.stderr}
        return

    out = _exec(["/tmp/exp_context_switch", str(round_trips)], timeout=60).stdout
    m = re.search(
        r"round_trip_us=([\d.]+) context_switch_us=([\d.]+) context_switches_per_sec=([\d.]+)", out
    )
    result = (
        {"round_trip_us": float(m.group(1)), "per_switch_us": float(m.group(2)), "switches_per_sec": float(m.group(3))}
        if m else {}
    )
    yield {"type": "result", "round_trips": round_trips, "result": result}


def ipc_performance_test(chunk_bytes: int):
    chunk_bytes = max(64, min(1048576, chunk_bytes))
    yield {"type": "start", "test": "ipc_performance"}

    compile_result = _compile("ipc_throughput.c", "/tmp/exp_ipc_throughput")
    if compile_result.returncode != 0:
        yield {"type": "error", "message": compile_result.stderr}
        return

    out = _exec(["/tmp/exp_ipc_throughput", str(chunk_bytes), "32"], timeout=60).stdout
    m = re.search(r"elapsed_s=([\d.]+) throughput_mb_s=([\d.]+)", out)
    result = {"elapsed_s": float(m.group(1)), "throughput_mb_s": float(m.group(2))} if m else {}
    yield {"type": "result", "chunk_bytes": chunk_bytes, "result": result}


def _parse_latency(text: str) -> dict:
    m = re.search(
        r"mean_us=([\d.]+) min_us=([\d.]+) max_us=([\d.]+) p50_us=([\d.]+) p99_us=([\d.]+)", text
    )
    if not m:
        return {}
    return {
        "mean_us": float(m.group(1)), "min_us": float(m.group(2)),
        "max_us": float(m.group(3)), "p50_us": float(m.group(4)), "p99_us": float(m.group(5)),
    }
