"""
Executes real commands inside the sandboxed kernel-sprint-env Docker
container -- never on the host. The container is a disposable sandbox
(the same image built and verified in Phase 0 of the kernel project),
so this bounds the blast radius of "live command execution from a web
page" to something that can be torn down and rebuilt, rather than
touching the user's actual machine.
"""
import os
import shlex
import subprocess
import threading
from pathlib import Path

DOCKER_SOCK = f"unix://{Path.home()}/.colima/kernel-sprint/docker.sock"
IMAGE = "kernel-sprint-env"
CONTAINER = "kernel-sprint-lab"

COMMAND_TIMEOUT_SEC = 30


def _docker_env():
    env = os.environ.copy()
    env["DOCKER_HOST"] = DOCKER_SOCK
    return env


def _run(argv: list[str], timeout: int = 15) -> subprocess.CompletedProcess:
    return subprocess.run(
        argv, env=_docker_env(), capture_output=True, text=True, timeout=timeout
    )


def ensure_container() -> None:
    """Start the persistent lab container if it isn't already running."""
    result = _run(
        ["docker", "inspect", "-f", "{{.State.Running}}", CONTAINER], timeout=10
    )
    if result.returncode == 0 and result.stdout.strip() == "true":
        return

    # container exists but stopped, or doesn't exist -- remove and recreate
    _run(["docker", "rm", "-f", CONTAINER], timeout=15)
    _run(
        [
            "docker", "run", "-d", "--name", CONTAINER, "--privileged",
            IMAGE, "sleep", "infinity",
        ],
        timeout=30,
    )


def is_connected() -> bool:
    result = _run(
        ["docker", "inspect", "-f", "{{.State.Running}}", CONTAINER], timeout=5
    )
    return result.returncode == 0 and result.stdout.strip() == "true"


def get_environment_info() -> dict:
    if not is_connected():
        return {"status": "disconnected"}

    kernel = _run(["docker", "exec", CONTAINER, "uname", "-r"], timeout=5)
    machine = _run(["docker", "exec", CONTAINER, "uname", "-a"], timeout=5)
    cpu = _run(["docker", "exec", CONTAINER, "nproc"], timeout=5)
    mem = _run(["docker", "exec", CONTAINER, "sh", "-c", "free -h | awk '/Mem:/{print $2}'"], timeout=5)

    return {
        "status": "connected",
        "kernel": kernel.stdout.strip() or "unknown",
        "machine": machine.stdout.strip() or "unknown",
        "cpu": f"{cpu.stdout.strip()} cores" if cpu.stdout.strip() else "unknown",
        "memory": mem.stdout.strip() or "unknown",
    }


def stream_command(command_line: str, timeout: int = COMMAND_TIMEOUT_SEC):
    """
    Runs a shell-word-split command inside the lab container and yields
    output lines as they arrive. The caller (api layer) is responsible
    for allow-listing the command before calling this.
    """
    try:
        argv = shlex.split(command_line)
    except ValueError as e:
        yield f"error: could not parse command: {e}\n"
        return
    if not argv:
        return

    full_argv = ["docker", "exec", CONTAINER] + argv
    proc = subprocess.Popen(
        full_argv,
        env=_docker_env(),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    timed_out = threading.Event()

    def _killer():
        timed_out.set()
        proc.kill()

    timer = threading.Timer(timeout, _killer)
    timer.start()
    try:
        for line in proc.stdout:
            yield line
        proc.wait()
    finally:
        timer.cancel()

    if timed_out.is_set():
        yield f"\n[killed: exceeded {timeout}s time limit]\n"
    else:
        yield f"\n[exit code: {proc.returncode}]\n"
