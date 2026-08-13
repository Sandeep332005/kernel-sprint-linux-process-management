"""
Kernel Sprint orchestrator -- real interactive lab.

Binds to 127.0.0.1 only (see run below): this is a local dev tool, not
a service meant to be reachable from the network. Command execution
happens inside the sandboxed kernel-sprint-env Docker container, never
on the host -- see agents/docker_agent.py.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.lab import router as lab_router

app = FastAPI(title="Kernel Sprint Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(lab_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8001)
