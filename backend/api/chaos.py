"""
/ws/chaos -- real, sandboxed failure injection. Every action is
confined to the disposable kernel-sprint-lab container; see
agents/chaos_agent.py for exactly what runs and why it can't reach
the host.
"""
import asyncio
import queue
import threading

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from agents import chaos_agent, docker_agent

router = APIRouter()

ACTIONS = {
    "cpu": lambda p: chaos_agent.cpu_stress(p.get("load_pct", 80), p.get("duration_sec", 5)),
    "memory": lambda p: chaos_agent.memory_stress(p.get("pct", 50), p.get("duration_sec", 5)),
    "disk": lambda p: chaos_agent.disk_stress(p.get("duration_sec", 5)),
    "network": lambda p: chaos_agent.network_delay(p.get("delay_ms", 200), p.get("duration_sec", 5)),
    "kill": lambda p: chaos_agent.kill_process_demo(),
}


@router.websocket("/ws/chaos")
async def chaos_socket(websocket: WebSocket):
    await websocket.accept()
    docker_agent.ensure_container()
    try:
        while True:
            request = await websocket.receive_json()
            action = request.get("action")
            factory = ACTIONS.get(action)
            if factory is None:
                await websocket.send_json({
                    "type": "error",
                    "message": f"unknown action '{action}'. Allowed: {', '.join(sorted(ACTIONS))}",
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
