"""
/api/results -- the real, already-captured 3-run baseline vs optimized
comparison (see ../data/results.json, generated from
../../results/*/results.md).

/ws/benchmark -- triggers a real, live run of the benchmark pipeline
against an already-built kernel image (baseline or optimized),
streaming compile/boot/execute progress and the freshly parsed result.
"""
import asyncio
import json
import queue
import threading
from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from agents import qemu_agent

router = APIRouter()

RESULTS_FILE = Path(__file__).resolve().parent.parent / "data" / "results.json"


@router.get("/api/results")
def results():
    return json.loads(RESULTS_FILE.read_text())


@router.websocket("/ws/benchmark")
async def benchmark_socket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            kernel = (await websocket.receive_text()).strip()

            # run_benchmark_pipeline() blocks on subprocess I/O for the
            # ~90s QEMU boot -- run it in a worker thread and relay
            # events through a queue so the event loop stays free to
            # serve other connections (e.g. /api/environment) meanwhile.
            events: queue.Queue = queue.Queue()

            def worker(kernel=kernel):
                for event in qemu_agent.run_benchmark_pipeline(kernel):
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
