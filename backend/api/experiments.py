"""
/ws/experiments -- real, parameterized experiments against the sandbox
container's own kernel. See agents/experiments_agent.py for exactly
which of these have a genuine before/after (only scheduler_optimization
does -- the others report one real measurement, honestly, rather than
being forced into a fabricated before/after shape).
"""
import asyncio
import queue
import threading

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from agents import docker_agent, experiments_agent

router = APIRouter()

TESTS = {
    "scheduler_optimization": lambda p: experiments_agent.scheduler_optimization_test(p.get("iterations", 500)),
    "process_creation": lambda p: experiments_agent.process_creation_test(p.get("iterations", 2000)),
    "context_switch": lambda p: experiments_agent.context_switch_test(p.get("round_trips", 20000)),
    "ipc_performance": lambda p: experiments_agent.ipc_performance_test(p.get("chunk_bytes", 4096)),
}


@router.websocket("/ws/experiments")
async def experiments_socket(websocket: WebSocket):
    await websocket.accept()
    docker_agent.ensure_container()
    try:
        while True:
            request = await websocket.receive_json()
            test = request.get("test")
            factory = TESTS.get(test)
            if factory is None:
                await websocket.send_json({
                    "type": "error",
                    "message": f"unknown test '{test}'. Allowed: {', '.join(sorted(TESTS))}",
                })
                continue

            events: queue.Queue = queue.Queue()

            def worker(factory=factory, params=request):
                for event in factory(params):
                    events.put(event)
                events.put(None)

            threading.Thread(target=worker, daemon=True).start()

            loop = asyncio.get_event_loop()
            while True:
                event = await loop.run_in_executor(None, events.get)
                if event is None:
                    break
                await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
