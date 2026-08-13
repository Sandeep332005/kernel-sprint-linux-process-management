#!/usr/bin/env bash
# Helper for the kernel-sprint dev environment: a dedicated Colima VM
# (4 CPU / 8GB RAM / 50GB disk) running an Ubuntu container with the
# kernel build/trace/benchmark toolchain (gcc, make, perf, ftrace,
# trace-cmd, qemu, stress-ng).
#
# Usage:
#   scripts/env.sh up       start the kernel-sprint Colima VM
#   scripts/env.sh build    build the kernel-sprint-env Docker image
#   scripts/env.sh shell    drop into an interactive shell in the container
#   scripts/env.sh down     stop the kernel-sprint Colima VM
set -euo pipefail

PROFILE="kernel-sprint"
IMAGE="kernel-sprint-env"
DOCKER_SOCK="unix://${HOME}/.colima/${PROFILE}/docker.sock"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "${1:-}" in
  up)
    colima start --profile "$PROFILE" --cpu 4 --memory 8 --disk 50 --runtime docker
    ;;
  build)
    DOCKER_HOST="$DOCKER_SOCK" docker build -t "$IMAGE" -f "$REPO_ROOT/docker/Dockerfile" "$REPO_ROOT/docker"
    ;;
  shell)
    DOCKER_HOST="$DOCKER_SOCK" docker run --rm -it -v "$REPO_ROOT:/workspace" -w /workspace "$IMAGE" bash
    ;;
  down)
    colima stop --profile "$PROFILE"
    ;;
  *)
    echo "usage: $0 {up|build|shell|down}" >&2
    exit 1
    ;;
esac
