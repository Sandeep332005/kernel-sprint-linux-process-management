"""
Kernel Sprint orchestrator -- real interactive lab.

Binds to 127.0.0.1 only (see run below): this is a local dev tool, not
a service meant to be reachable from the network. Command execution
happens inside the sandboxed kernel-sprint-env Docker container, never
on the host -- see agents/docker_agent.py.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.benchmark import router as benchmark_router
from api.lab import router as lab_router
from api.monitor import router as monitor_router
from api.patch import router as patch_router

app = FastAPI(title="Kernel Sprint Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4477"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(lab_router)
app.include_router(benchmark_router)
app.include_router(patch_router)
app.include_router(monitor_router)


@app.get("/")
def root():
    return {
        "service": "kernel-sprint-orchestrator",
        "frontend": "http://localhost:4477 (the actual website)",
        "endpoints": [
            "/api/environment", "/ws/lab", "/api/results", "/ws/benchmark",
            "/ws/patch", "/api/example-patch", "/ws/monitor",
        ],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8877)
