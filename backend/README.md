# Kernel Sprint orchestrator — real interactive lab

Executes real commands inside the sandboxed `kernel-sprint-env` Docker
container (the same image built in Phase 0 of the kernel project) and
streams the output to the web `/lab` page over a WebSocket. Command
execution never touches the host — only the disposable container.

## Setup

```
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Requires the `kernel-sprint` Colima VM to be running
(`../scripts/env.sh up`) and the `kernel-sprint-env` image built
(`../scripts/env.sh build`).

## Run

```
source .venv/bin/activate
python main.py
```

Binds to `127.0.0.1:8001` only — not reachable from the network. The
Next.js frontend (`../web`, `npm run dev`, port 3000) talks to it via
CORS-restricted HTTP (`GET /api/environment`) and WebSocket
(`/ws/lab`).

## Command allow-list

`agents/docker_agent.py` executes commands with `docker exec` (no
shell — argv is passed directly, so shell metacharacters like `|` or
`;` are inert, not interpreted) inside a persistent `kernel-sprint-lab`
container. `api/lab.py` only forwards commands whose first token is in:

```
perf, trace-cmd, stress-ng, ps, top, uname
```

`systemctl` was deliberately left out (the container has no systemd)
and there is no arbitrary-shell escape hatch. Every command has a hard
30-second execution timeout enforced server-side regardless of the
command's own flags.
