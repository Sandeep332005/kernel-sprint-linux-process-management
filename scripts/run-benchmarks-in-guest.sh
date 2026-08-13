#!/usr/bin/env bash
# Boots a built arm64 kernel Image under QEMU with a minimal busybox
# initramfs containing the three benchmark binaries, captures the
# serial console output (which includes the benchmark results), and
# saves it to results/<label>/qemu-boot.log.
#
# Usage: scripts/run-benchmarks-in-guest.sh <path-to-Image-inside-container> <label>
# Example: scripts/run-benchmarks-in-guest.sh /build/arch/arm64/boot/Image baseline
set -euo pipefail

IMAGE_PATH="$1"
LABEL="$2"
PROFILE="kernel-sprint"
DOCKER_SOCK="unix://${HOME}/.colima/${PROFILE}/docker.sock"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$REPO_ROOT/results/$LABEL"

# Figure out which docker volume backs the build dir from the image path
# prefix (/build -> kernel-sprint-build-baseline or -optimized, chosen
# by the caller via the volume name passed as $3 if given).
BUILD_VOLUME="${3:-kernel-sprint-build-baseline}"

DOCKER_HOST="$DOCKER_SOCK" docker run --rm \
  -v "$BUILD_VOLUME:/build" \
  -v "$REPO_ROOT:/workspace:ro" \
  kernel-sprint-env bash -c "
set -e
rm -rf /tmp/initramfs
mkdir -p /tmp/initramfs/bin
cp /workspace/scripts/initramfs-staging/init /tmp/initramfs/init
gcc -O2 -static -o /tmp/initramfs/bin/process_creation /workspace/benchmark/process_creation.c
gcc -O2 -static -o /tmp/initramfs/bin/context_switch /workspace/benchmark/context_switch.c
gcc -O2 -static -o /tmp/initramfs/bin/scheduler_latency /workspace/benchmark/scheduler_latency.c -lpthread
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
" | tee "$REPO_ROOT/results/$LABEL/qemu-boot.log"

echo ""
echo "=== saved to results/$LABEL/qemu-boot.log ==="
