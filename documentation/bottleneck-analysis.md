# Phase 4 — Bottleneck Analysis

## Problem description

Under CPU contention (all cores busy), a task that becomes runnable
does not run immediately — it waits until the currently-running task's
EEVDF time slice expires (or the running task blocks/yields). The
`scheduler_latency` benchmark measures exactly this: a probe thread
wakes on a fixed 2ms schedule while N CPU-hog threads (N = online CPU
count) saturate every core, and reports how much later than its
intended wake time the probe actually resumes.

## Measurement results

From `results/baseline/results.md` (real boot of the unpatched
`linux-6.6.151` kernel under QEMU, 4 vCPUs, 4 hog threads + 1 probe):

| metric | value |
|---|---|
| mean | 492.175 µs |
| min | 142.528 µs |
| p50 | 153.888 µs |
| p99 | 5541.504 µs |
| max | 6501.088 µs |

The gap between p50 (154µs) and p99 (5.5ms) — a >35x spread — is the
signal: most wake-ups are fast, but a long tail of wake-ups wait far
longer. This is corroborated by `results/baseline/perf-sched-latency.txt`
(real `perf sched record`/`perf sched latency` capture on the same
EEVDF algorithm, container host kernel): the probe-equivalent thread in
that run shows an average delay of 0.011ms but a **max delay of
2.586ms** over just 303 switches — the same tail-spike shape.

## Kernel function involved

`kernel/sched/fair.c`:

- `pick_next_entity()` → `pick_eevdf()` → `__pick_eevdf()`: selects the
  next task to run from the eligible set by earliest virtual deadline.
- `place_entity()` / `update_deadline()`: compute each entity's
  deadline as `vruntime + slice / weight`, where `slice` comes from
  `sysctl_sched_base_slice` (fair.c:78, default 700000ns).
- `entity_eligible()`: a task only becomes eligible to be picked once
  its lag is non-negative relative to the run queue's average — this
  is what makes a freshly-woken task wait rather than instantly
  preempt.

## Root cause

`sysctl_sched_base_slice` (700µs) sets how long a task's requested
slice is, which directly sets how far out its deadline is computed.
When a CPU is saturated by a hog with a not-yet-expired deadline, a
newly-woken higher-priority-by-wake-time task must wait for that
deadline to arrive (or for `entity_eligible()` to admit it) before
`__pick_eevdf()` will select it. With `nr_running > nr_cpus` (5 runnable
threads on 4 CPUs in this benchmark), some thread is always waiting,
and the worst case wait is bounded by how long the base slice lets the
current occupant run — a mechanism directly reflected in the p99/max
tail observed above. This is not a bug: it is EEVDF trading latency for
throughput/cache-locality exactly as designed, tunable via the base
slice constant identified in
[`documentation/subsystem-selection.md`](subsystem-selection.md).
