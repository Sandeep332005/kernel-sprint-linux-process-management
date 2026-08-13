# Phase 0 — Environment Setup

## Host: macOS

`gcc` on macOS is Apple clang, not real GCC, and `perf`/`ftrace`/`trace-cmd`
don't exist on macOS at all — they're Linux kernel facilities. Building and
boot-testing a custom Linux kernel needs a real Linux VM, not just a
Docker container (containers share the host kernel and can't boot a
different one).

## Setup: dedicated Colima VM

A dedicated Colima profile, `kernel-sprint`, was created separately from
the `default` profile (used by other, unrelated projects) so kernel builds
don't compete with or disrupt other work:

- 4 CPUs, 8GB RAM, 50GB disk (matches the project's own Phase-0 minimums)
- Docker runtime, `macOS Virtualization.Framework` backend
- Sockets: `~/.colima/kernel-sprint/docker.sock` / `containerd.sock`

Inside it, `docker/Dockerfile` builds an Ubuntu 24.04 image
(`kernel-sprint-env`) with:

- `build-essential`, `gcc`, `make`, `git`
- `linux-tools-common`, `linux-tools-generic`, and `linux-tools-$(uname -r)`
  (perf needs the package matching the VM's exact running kernel, not just
  the generic metapackage)
- `trace-cmd`
- `qemu-system-x86`, `qemu-utils`
- `stress-ng`
- kernel build deps: `flex`, `bison`, `libssl-dev`, `libelf-dev`, `bc`,
  `libncurses-dev`, `dwarves`

## Usage

```
scripts/env.sh up      # start the kernel-sprint Colima VM
scripts/env.sh build   # build the kernel-sprint-env image
scripts/env.sh shell   # interactive shell, repo mounted at /workspace
scripts/env.sh down    # stop the VM
```

## Verified

- `gcc 13.3.0`, `make 4.3`, `git 2.43.0` ✓
- `qemu-system-x86_64 8.2.2` ✓
- `stress-ng 0.17.06` ✓
- `trace-cmd 3.2.0` ✓ (note: `trace-cmd --version` prints usage and exits
  non-zero — a quirk of the tool, not a fault; check output, not exit code)
- `perf 6.8.12` ✓ — required `linux-tools-6.8.0-117-generic` (exact match
  to the VM's running kernel, aarch64); pinned in the Dockerfile via
  `linux-tools-$(uname -r)` at build time.

## Incident: host disk filled during first build

The first `docker build` of this image (before the `perf` fix and before
`--no-cache`) coincided with the host Mac's disk filling to ~180MB free
(a pre-existing, unrelated accumulation in `~/Library`, `~/.lmstudio`,
`~/Downloads`, `~/.ollama`, etc. — not caused by this VM). A subsequent
`--no-cache` rebuild hit `ENOSPC` mid-layer-commit, which silently
corrupted shared libraries in the cached layer (`file too short` errors
for `libtraceevent`, `libpixman`, `libjpeg`). The fix was `docker rmi -f`
+ `docker builder prune -af` + `docker system prune -af`, then a full
`--no-cache` rebuild once the host had ~25GB free. Lesson: if a Docker
build coincides with a host disk-space problem, don't trust the cache —
purge and rebuild clean once space is confirmed available.

## Known limitation

The VM's host kernel is whatever Colima's VM image ships (currently
`6.8.0-117-generic`) — this is **not** the kernel that gets built in
Phase 6. `perf`/`ftrace` inside this container trace the VM's host kernel,
useful for benchmarking userspace programs (Phase 3 benchmarks) but not
for tracing a custom-built kernel. Boot-testing a custom kernel (Phase 6)
requires running it under `qemu-system-x86_64` as a guest, which is
installed and ready but not yet scripted.
