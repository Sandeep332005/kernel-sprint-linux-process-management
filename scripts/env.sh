#!/usr/bin/env bash
# Helper for the kernel-sprint dev environment: a dedicated Colima VM
# (4 CPU / 8GB RAM / 50GB disk) running an Ubuntu container with the
# kernel build/trace/benchmark toolchain (gcc, make, perf, ftrace,
# trace-cmd, qemu, stress-ng).
#
# The kernel source lives in the Docker volume `kernel-sprint-src`, which
# is backed by the VM's native ext4 disk — NOT under $REPO_ROOT/kernel on
# the host. macOS's APFS is case-insensitive (even via virtiofs mounts),
# and the Linux tree has files that differ only by case in the same
# directory (xt_DSCP.c / xt_dscp.c, xt_HL.c / xt_hl.c, ...) that collide
# and silently corrupt the tree if cloned onto a host-mounted path.
#
# Usage:
#   scripts/env.sh up       start the kernel-sprint Colima VM
#   scripts/env.sh build    build the kernel-sprint-env Docker image
#   scripts/env.sh shell    shell in the container, repo mounted at /workspace,
#                           kernel source volume mounted at /kernel
#   scripts/env.sh trim     reclaim host disk space from deleted-but-not-yet-
#                           trimmed files inside the VM (see docs/environment-setup.md)
#   scripts/env.sh down     stop the kernel-sprint Colima VM
set -euo pipefail

PROFILE="kernel-sprint"
IMAGE="kernel-sprint-env"
SRC_VOLUME="kernel-sprint-src"
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
    DOCKER_HOST="$DOCKER_SOCK" docker run --rm -it \
      -v "$REPO_ROOT:/workspace" -w /workspace \
      -v "$SRC_VOLUME:/kernel" \
      "$IMAGE" bash
    ;;
  trim)
    colima ssh --profile "$PROFILE" -- sudo fstrim -av
    ;;
  down)
    colima stop --profile "$PROFILE"
    ;;
  *)
    echo "usage: $0 {up|build|shell|trim|down}" >&2
    exit 1
    ;;
esac
