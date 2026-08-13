"""
/api/environment and /ws/lab -- the real interactive lab endpoints.

Command execution is restricted to a fixed allow-list. This is
deliberately not "run any shell command a browser sends" -- the
backend only accepts commands whose first token is a known,
non-destructive analysis/benchmark tool, and every invocation runs
inside the disposable kernel-sprint-env container (see docker_agent.py)
with a hard timeout.
"""
import shlex

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from agents import docker_agent

router = APIRouter()

ALLOWED_COMMANDS = {"perf", "trace-cmd", "stress-ng", "ps", "top", "uname"}


@router.get("/api/environment")
def environment():
    docker_agent.ensure_container()
    return docker_agent.get_environment_info()


@router.websocket("/ws/lab")
async def lab_socket(websocket: WebSocket):
    await websocket.accept()
    docker_agent.ensure_container()
    try:
        while True:
            command_line = await websocket.receive_text()
            command_line = command_line.strip()
            if not command_line:
                continue

            try:
                first = shlex.split(command_line)[0]
            except (ValueError, IndexError):
                await websocket.send_text("error: empty or unparseable command\n")
                continue

            if first not in ALLOWED_COMMANDS:
                await websocket.send_text(
                    f"error: '{first}' is not allowed. "
                    f"Allowed commands: {', '.join(sorted(ALLOWED_COMMANDS))}\n"
                )
                continue

            for line in docker_agent.stream_command(command_line):
                await websocket.send_text(line)
    except WebSocketDisconnect:
        pass
