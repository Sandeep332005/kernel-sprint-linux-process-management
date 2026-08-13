# Kernel Sprint — Final Performance Report

## 1. Introduction

This project analyzes the Linux Completely Fair Scheduler (EEVDF, as of
6.6+), identifies a measurable wake-up-latency bottleneck under CPU
contention, implements a targeted one-line kernel patch, and validates
the change with real before/after benchmarks, correctness stress
testing, and POSIX compliance checks — all run against actual booted
kernel images, not simulated.

## 2. Problem statement

Under CPU contention, a newly-woken task doesn't run immediately — it
waits for the currently-running task to become ineligible or reach its
EEVDF deadline. How long that wait can be is governed by
`sysctl_sched_base_slice` (`kernel/sched/fair.c`), the requested slice
length used to compute every task's deadline. The upstream default is
700µs. The question: does reducing it measurably lower wake-up latency,
and at what cost?

## 3. Bottleneck analysis

Full detail: [`documentation/bottleneck-analysis.md`](bottleneck-analysis.md).

Real measurement (`results/baseline/results.md`, unpatched kernel, 3
boot-tested runs) showed a >30x spread between p50 (153µs) and p99
(4373µs avg) wake-up latency under 4-way CPU contention — most wake-ups
are fast, but a long tail waits far longer. A real `perf sched record`/
`perf sched latency` capture (`results/baseline/perf-sched-latency.txt`)
corroborated the same tail-spike shape on the same EEVDF algorithm.
Traced to `pick_next_entity()` → `pick_eevdf()` → `__pick_eevdf()` and
the deadline formula `vruntime + sysctl_sched_base_slice / weight` in
`update_deadline()`/`place_entity()`.

## 4. Optimization method

Full detail: [`documentation/design.md`](design.md).

Rather than rewriting `__pick_eevdf()`'s O(log n) augmented-rbtree
search (a correctness risk given the scope of this project),
`sysctl_sched_base_slice` was reduced from 700000ns to 300000ns — a
bounded, safe, single-constant change that alters the latency/throughput
trade-off EEVDF already exposes, without touching the picking algorithm
or fairness/eligibility logic.

## 5. Implementation details

- Patch: [`patches/scheduler-optimization.patch`](../patches/scheduler-optimization.patch)
  (Linux-style commit message, `git format-patch` output).
- Target: `kernel/sched/fair.c`, lines defining `sysctl_sched_base_slice`
  and its cached `normalized_sysctl_sched_base_slice` counterpart
  (verified the latter is purely derived via `sched_update_scaling()`,
  not an independent source of truth).
- Build: `linux-6.6.151`, `ARCH=arm64` `defconfig` (+`DEBUG_INFO_REDUCED`),
  built natively on the `kernel-sprint` Colima VM. **Architecture note**:
  built and boot-tested for **arm64**, not the x86_64 assumed by the
  project's own example commands — this Colima VM runs on Apple Silicon,
  and arm64 is the pragmatic native target here (no cross-compiler,
  faster builds). Documented in
  [`documentation/subsystem-selection.md`](subsystem-selection.md).
- Both baseline and patched kernels built successfully and booted
  cleanly under `qemu-system-aarch64 -M virt -smp 4 -m 1024` (no panic,
  clean `poweroff` in both cases — see `results/*/qemu-boot.log`).

## 6. Benchmark results

Full detail and honest discussion: [`results/optimized/results.md`](../results/optimized/results.md).

Three benchmark programs (`benchmark/process_creation.c`,
`context_switch.c`, `scheduler_latency.c`) were statically compiled and
run inside a minimal busybox initramfs booted under QEMU — 3 repeated
runs per kernel to distinguish real effects from single-run VM noise.

| metric | baseline avg | optimized avg | change |
|---|---|---|---|
| process_creation mean | 2838.25 µs | 2892.34 µs | +1.9% (worse) |
| process_creation p99 | 3402.62 µs | 3690.92 µs | +8.5% (worse) |
| context_switch switches/sec | 5588.67 | 5464.00 | -2.2% (worse) |
| scheduler_latency mean | 434.91 µs | 431.82 µs | -0.7% (flat) |
| **scheduler_latency p99** | **4372.66 µs** | **3183.07 µs** | **-27.2% (better)** |
| scheduler_latency max | 6441.93 µs | 6274.93 µs | -2.6% (slightly better) |

**The targeted metric — `scheduler_latency` p99 — improved in every
single one of the 3 runs individually** (5541.5→2702.0, 3735.1→3577.6,
3841.4→3269.6 µs), not just on average. That's the mechanism from
Section 3/4 showing up as real, reproducible data.

`process_creation` and `context_switch` show small average regressions,
but driven by one outlier run each rather than a consistent per-run
direction — reported honestly as measured, not smoothed over, but not
strong enough evidence (with only 3 runs) to confidently call it a real
throughput cost either. More runs would be needed to settle it.

Absolute magnitudes are inflated across the board by QEMU's TCG software
emulation (no nested virtualization available inside the Colima VM),
but that inflation applies equally to both kernels, so the relative
comparison stands.

## 7. Correctness testing

Full logs: `results/baseline-correctness/correctness.log`,
`results/optimized-correctness/correctness.log`.

`stress-ng` itself is a large dynamically-linked tool that doesn't fit
the static-binary busybox-initramfs approach used for guest testing in
the time available, so `benchmark/stress_test.c` was written as an
equivalent, documented substitution: 3 rounds of 100x `fork`+`wait` and
100x `pthread_create`+`join` (matching `stress-ng --fork 100` /
`--pthread 100`), run concurrently with 4 CPU-hog threads (matching
`--cpu 4`) for 3 seconds. **Result: 0 failures, RESULT=PASS on both the
baseline and patched kernel** — no crash, no deadlock, no corrupted
shared state under contention.

## 8. POSIX compliance

`benchmark/posix_validation.c`, run inside both booted kernels — all 6
checks **PASS** on both:

- `fork()`: parent receives positive child PID.
- `wait()`: correct child PID and exit status (77) retrieved.
- `exec()`: `execve()` replaced the process image; replacement ran to
  completion with the expected exit code.
- `SIGTERM`: terminated a blocked child with the correct signal number.
- `SIGKILL`: terminated a child unconditionally, even with SIGTERM
  blocked.

No POSIX regression from the patch — expected, since the change is
confined to `kernel/sched/fair.c`'s tuning constant and touches none of
the fork/exec/signal code paths.

## 9. Future improvements

- Run more than 3 repetitions (ideally 10+) to get real confidence
  intervals instead of eyeballing outlier-vs-pattern by hand.
- Investigate whether the `process_creation`/`context_switch` averages
  are a real, small throughput cost of the shorter slice (as the design
  doc predicted might happen) or pure noise, with a larger sample.
  A paired design (interleaving baseline/optimized runs rather than
  blocking them) would also reduce confounds from host-load drift
  across a boot-test session.
- Try intermediate values between 700µs and 300µs to find where the
  p99 improvement saturates vs. where throughput cost (if real) starts
  to bite — a single-point comparison doesn't reveal the curve shape.
- Get `stress-ng` itself running in-guest (e.g. via a small root
  filesystem image instead of a pure initramfs, or a static build)
  for a more standard, comparable correctness signal than the custom
  harness used here.
- Re-run under real hardware-accelerated virtualization (KVM on a
  Linux host, or nested virtualization if the Colima VM ever exposes
  it) to get absolute latency numbers representative of bare metal,
  not TCG-emulation-inflated ones.
- Test with actual x86_64 target (the architecture the project's own
  example commands assume) using a cross-compilation toolchain, to
  confirm the same effect holds there.
