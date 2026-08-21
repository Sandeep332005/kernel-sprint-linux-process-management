"""Shared Docker connection details for the kernel-sprint Colima VM."""
import os
from pathlib import Path

PROFILE = "kernel-sprint"
DOCKER_SOCK = f"unix://{Path.home()}/.colima/{PROFILE}/docker.sock"


def docker_env():
    env = os.environ.copy()
    env["DOCKER_HOST"] = DOCKER_SOCK
    return env
