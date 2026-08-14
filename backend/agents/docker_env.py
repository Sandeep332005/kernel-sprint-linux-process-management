"""Shared Docker connection details for the kernel-sprint Colima VM."""
import os
from pathlib import Path

DOCKER_SOCK = f"unix://{Path.home()}/.colima/kernel-sprint/docker.sock"


def docker_env():
    env = os.environ.copy()
    env["DOCKER_HOST"] = DOCKER_SOCK
    return env
