# Optimized results — patched linux-6.6.y (3 runs)

Kernel: `linux-6.6.151-00001-g5096b57cd167`, arch `arm64`, same
`defconfig` + `DEBUG_INFO_REDUCED` config as baseline, with
`patches/scheduler-optimization.patch` applied
(`sysctl_sched_base_slice`: 700000 → 300000 ns). Same VM, same QEMU
invocation, same benchmark binaries as the baseline runs — the only
difference between these two sets of numbers is that one-line kernel
change.

Raw logs: `results/optimized/qemu-boot.log`,
`results/optimized-run2/qemu-boot.log`, `results/optimized-run3/qemu-boot.log`.

## process_creation (fork+exit+wait, 5000 iterations)

| run | mean µs | min µs | max µs | p50 µs | p99 µs |
|---|---|---|---|---|---|
| 1 | 3024.504 | 2622.160 | 10676.272 | 2975.408 | 4345.024 |
| 2 | 2823.105 | 2486.736 | 7588.032 | 2812.368 | 3340.784 |
| 3 | 2829.417 | 2457.456 | 7691.024 | 2811.792 | 3386.960 |
| **avg** | **2892.34** | **2522.12** | **8651.78** | **2866.52** | **3690.92** |

## context_switch (pipe ping-pong, 20000 round trips)

| run | round trip µs | per switch µs | switches/sec |
|---|---|---|---|
| 1 | 359.114 | 179.557 | 5569 |
| 2 | 355.705 | 177.852 | 5623 |
| 3 | 384.615 | 192.308 | 5200 |
| **avg** | **366.48** | **183.24** | **5464.00** |

## scheduler_latency (4 CPU hogs + probe, 1000 iterations, 2ms interval)

| run | mean µs | min µs | max µs | p50 µs | p99 µs |
|---|---|---|---|---|---|
| 1 | 472.334 | 143.520 | 7533.200 | 153.792 | 2701.968 |
| 2 | 377.547 | 142.224 | 3866.096 | 151.296 | 3577.600 |
| 3 | 445.592 | 143.408 | 7425.488 | 155.072 | 3269.632 |
| **avg** | **431.82** | **143.05** | **6274.93** | **153.39** | **3183.07** |

## Comparison vs baseline (3-run averages)

| metric | baseline avg | optimized avg | change |
|---|---|---|---|
| process_creation mean | 2838.25 µs | 2892.34 µs | **+1.9% (worse)** |
| process_creation p99 | 3402.62 µs | 3690.92 µs | **+8.5% (worse)** |
| context_switch switches/sec | 5588.67 | 5464.00 | **-2.2% (worse)** |
| scheduler_latency mean | 434.91 µs | 431.82 µs | -0.7% (flat) |
| scheduler_latency p50 | 153.22 µs | 153.39 µs | +0.1% (flat) |
| **scheduler_latency p99** | **4372.66 µs** | **3183.07 µs** | **-27.2% (better)** |
| scheduler_latency max | 6441.93 µs | 6274.93 µs | -2.6% (slightly better) |

## Honest read of these numbers

**The targeted metric improved, consistently, in every single run.**
`scheduler_latency` p99 — tail wake-up latency under CPU contention,
exactly what `sysctl_sched_base_slice` governs per
`documentation/bottleneck-analysis.md` — dropped in all 3 individual
runs (5541.5→2702.0, 3735.1→3577.6, 3841.4→3269.6 µs), not just on
average. That's the signal the design predicted.

**`process_creation` and `context_switch` did not clearly improve or
regress.** Their averages moved slightly against the optimized kernel,
but that's mostly one outlier run each (process_creation run 1 at
3024.5µs mean vs. ~2825µs in runs 2-3; context_switch run 3 at 5200
switches/sec vs. ~5570-5620 in runs 1-2), not a per-run-consistent
pattern the way `scheduler_latency` p99 is. With only 3 runs under
TCG-emulated QEMU (see the noise caveat in the design doc and
`results/baseline/results.md`), this reads as measurement noise rather
than a real throughput cost — but it is reported as measured, not
smoothed over, because a real regression of this size is exactly the
kind of thing Phase 5 flagged as a *plausible* trade-off, and more
runs would be needed to rule it out with confidence.

**Bottom line**: this is a real, targeted latency improvement with no
clear cost on the metrics measured, backed by a mechanistic explanation
(Phase 4) and a design that predicted exactly this trade-off shape
(Phase 5) — not a blanket "everything got faster" claim.
