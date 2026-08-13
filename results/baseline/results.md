# Baseline results — unpatched linux-6.6.y (3 runs)

Kernel: `linux-6.6.151`, arch `arm64`, `defconfig` + `DEBUG_INFO_REDUCED`,
branch `kernel-sprint-cfs-optimization` before the scheduler patch.
Built natively on the `kernel-sprint` Colima VM (aarch64), booted under
`qemu-system-aarch64 -M virt -smp 4 -m 1024` (software TCG emulation —
no nested KVM/HVF available). `sysctl_sched_base_slice` = 700000 ns
(upstream default) for all 3 runs below.

Raw logs: `results/baseline/qemu-boot.log`,
`results/baseline-run2/qemu-boot.log`, `results/baseline-run3/qemu-boot.log`.

## process_creation (fork+exit+wait, 5000 iterations)

| run | mean µs | min µs | max µs | p50 µs | p99 µs |
|---|---|---|---|---|---|
| 1 | 2846.508 | 2509.696 | 8087.056 | 2826.336 | 3445.488 |
| 2 | 2814.035 | 2474.960 | 5482.528 | 2802.784 | 3325.664 |
| 3 | 2854.207 | 2494.160 | 7484.608 | 2842.624 | 3436.704 |
| **avg** | **2838.25** | **2492.94** | **7018.06** | **2823.91** | **3402.62** |

## context_switch (pipe ping-pong, 20000 round trips)

| run | round trip µs | per switch µs | switches/sec |
|---|---|---|---|
| 1 | 357.916 | 178.958 | 5588 |
| 2 | 356.838 | 178.419 | 5605 |
| 3 | 358.842 | 179.421 | 5573 |
| **avg** | **357.87** | **178.93** | **5588.67** |

## scheduler_latency (4 CPU hogs + probe, 1000 iterations, 2ms interval)

| run | mean µs | min µs | max µs | p50 µs | p99 µs |
|---|---|---|---|---|---|
| 1 | 492.175 | 142.528 | 6501.088 | 153.888 | 5541.504 |
| 2 | 390.405 | 144.096 | 5836.880 | 152.912 | 3735.056 |
| 3 | 422.144 | 117.168 | 6987.808 | 152.864 | 3841.408 |
| **avg** | **434.91** | **134.60** | **6441.93** | **153.22** | **4372.66** |

See `results/optimized/results.md` for the patched-kernel numbers and
the comparison.
