# Baseline results — unpatched linux-6.6.y

Kernel: `linux-6.6.151`, arch `arm64`, `defconfig` + `DEBUG_INFO_REDUCED`,
branch `kernel-sprint-cfs-optimization` at the point of the initial clone
(no scheduler patch applied). Built natively on the `kernel-sprint`
Colima VM (aarch64), booted under `qemu-system-aarch64 -M virt -smp 4
-m 1024` (software TCG emulation — no nested KVM/HVF available inside
the Colima VM). Full boot log: `results/baseline/qemu-boot.log`.

`sysctl_sched_base_slice` at this point: **700000 ns (700µs)**, the
upstream default.

## process_creation (fork+exit+wait, 5000 iterations)

| metric | value |
|---|---|
| mean | 2846.508 µs |
| min | 2509.696 µs |
| max | 8087.056 µs |
| p50 | 2826.336 µs |
| p99 | 3445.488 µs |

## context_switch (pipe ping-pong, 20000 round trips)

| metric | value |
|---|---|
| round trip | 357.916 µs |
| per context switch | 178.958 µs |
| context switches/sec | 5588 |

## scheduler_latency (cyclictest-style, 4 CPU hogs + probe, 1000 iterations, 2ms interval)

| metric | value |
|---|---|
| mean | 492.175 µs |
| min | 142.528 µs |
| max | 6501.088 µs |
| p50 | 153.888 µs |
| p99 | 5541.504 µs |

## Note on absolute magnitudes

These numbers are much higher than the same benchmarks run on the
container's native host kernel (e.g. process_creation mean 90µs there
vs 2846µs here — see `results/baseline/smoke-test-toolchain-kernel.md`).
That gap is expected: QEMU's `-M virt` guest here runs under TCG
software emulation, not hardware-accelerated virtualization, because
the Colima VM itself doesn't expose nested virtualization. Every trap,
syscall, and interrupt is binary-translated rather than running
natively. This inflates absolute latency substantially but applies
identically to both the baseline and optimized runs, so the **relative
before/after comparison** (the actual point of this project) remains
valid even though the absolute numbers aren't representative of bare
-metal performance.
