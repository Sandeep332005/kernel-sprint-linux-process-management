#!/usr/bin/env bash
# Boots a built arm64 kernel Image under QEMU with a minimal busybox
# initramfs containing posix_validation and stress_test, captures the
# serial console output, and saves it to results/<label>/correctness.log.
#
# Usage: scripts/run-correctness-in-guest.sh <path-to-Image-inside-container> <label> <build-volume>
set -euo pipefail

IMAGE_PATH="$1"
LABEL="$2"
BUILD_VOLUME="${3:-kernel-sprint-build-baseline}"
PROFILE="kernel-sprint"
DOCKER_SOCK="unix://${HOME}/.colima/${PROFILE}/docker.sock"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$REPO_ROOT/results/$LABEL"

DOCKER_HOST="$DOCKER_SOCK" docker run --rm \
  -v "$BUILD_VOLUME:/build" \
  -v "$REPO_ROOT:/workspace:ro" \
  kernel-sprint-env bash -c "
set -e
rm -rf /tmp/initramfs
mkdir -p /tmp/initramfs/bin
cp /workspace/scripts/initramfs-staging/init-correctness /tmp/initramfs/init
gcc -O2 -static -o /tmp/initramfs/bin/posix_validation /workspace/benchmark/posix_validation.c
gcc -O2 -static -o /tmp/initramfs/bin/stress_test /workspace/benchmark/stress_test.c -lpthread
cp /bin/busybox /tmp/initramfs/bin/busybox
chmod +x /tmp/initramfs/init /tmp/initramfs/bin/*
cd /tmp/initramfs
find . | cpio -o -H newc 2>/dev/null | gzip > /tmp/initramfs.cpio.gz

timeout 120 qemu-system-aarch64 \
  -M virt -cpu max -smp 4 -m 1024 \
  -kernel $IMAGE_PATH \
  -initrd /tmp/initramfs.cpio.gz \
  -append 'console=ttyAMA0 rdinit=/init panic=1' \
  -nographic -no-reboot 2>&1
" | tee "$REPO_ROOT/results/$LABEL/correctness.log"

echo ""
echo "=== saved to results/$LABEL/correctness.log ==="
