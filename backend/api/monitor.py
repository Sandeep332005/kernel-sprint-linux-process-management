"""
/ws/monitor -- real eBPF kernel monitoring. Streams one metrics dict
per second (real sched_switch/sched_wakeup tracepoint counts via
bpftrace, real CPU%/memory%/process list from /proc) until the client
disconnects.
"""
import asyncio
import queue
import threading

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from agents import docker_agent, ebpf_agent

router = APIRouter()


@router.websocket("/ws/monitor")
async def monitor_socket(websocket: WebSocket):
    await websocket.accept()
    docker_agent.ensure_container()

    events: queue.Queue = queue.Queue()
    stop_event = threading.Event()

    def worker():
        for metrics in ebpf_agent.stream_metrics(stop_event):
            events.put(metrics)
        events.put(None)

    threading.Thread(target=worker, daemon=True).start()

    loop = asyncio.get_event_loop()
    try:
        while True:
            metrics = await loop.run_in_executor(None, events.get)
            if metrics is None:
                break
            await websocket.send_json(metrics)
    except WebSocketDisconnect:
        pass
    finally:
        stop_event.set()
