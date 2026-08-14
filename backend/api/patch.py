"""
/ws/patch -- upload a patch, apply it to a scratch copy of the kernel
source, build, boot, benchmark, compare against baseline, report. The
slowest and most powerful pipeline: a real kernel build takes several
minutes even on this hardware.
"""
import asyncio
import queue
import threading

from fastapi import APIRouter, Response, WebSocket, WebSocketDisconnect

from agents import patch_agent
from agents.qemu_agent import REPO_ROOT

router = APIRouter()

EXAMPLE_PATCH = REPO_ROOT / "patches" / "scheduler-optimization.patch"


@router.get("/api/example-patch")
def example_patch():
    return Response(content=EXAMPLE_PATCH.read_text(), media_type="text/plain")


@router.websocket("/ws/patch")
async def patch_socket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            patch_text = await websocket.receive_text()

            events: queue.Queue = queue.Queue()

            def worker(patch_text=patch_text):
                for event in patch_agent.run_patch_pipeline(patch_text):
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
