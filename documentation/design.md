# Phase 5 — Optimization Design

## Current flow

```
User Process (blocked, waiting on I/O/futex/timer)
    |
    v
Wake-up event (irq / futex_wake / timer)
    |
    v
try_to_wake_up() -> enqueue_entity() -> entity is inserted into the
    EEVDF tree with deadline = vruntime + sysctl_sched_base_slice / weight
    |
    v
Currently running task keeps running on its CPU until its own deadline
    is reached or it becomes ineligible (entity_eligible() check)
    |
    v
pick_next_entity() -> pick_eevdf() -> __pick_eevdf() selects the
    earliest-deadline eligible entity next time the scheduler runs
    |
    v
CPU switches to the newly-eligible task
```

With `sysctl_sched_base_slice = 700000` (700µs), a freshly-woken task's
deadline can be up to ~700µs (scaled by weight) later than its
vruntime, and the currently-running task can hold the CPU for a
comparable span before yielding — this is the 700µs upper bound
reflected in the p99/max tail measured in Phase 4.

## Optimized flow

```
User Process (blocked, waiting on I/O/futex/timer)
    |
    v
Wake-up event
    |
    v
try_to_wake_up() -> enqueue_entity() -> deadline = vruntime +
    sysctl_sched_base_slice / weight   [ base_slice: 700000 -> 300000 ]
    |
    v
Currently running task's own slice is shorter too -> reaches its
    deadline / becomes ineligible sooner
    |
    v
pick_next_entity() -> pick_eevdf() -> __pick_eevdf()  [unchanged logic]
    |
    v
CPU switches to the newly-eligible task, sooner
```

The picking algorithm itself (`__pick_eevdf()`, the augmented-rbtree
O(log n) search) is **not** modified. Only the input constant that
determines how far out deadlines are placed changes. This keeps the
change to exactly what Phase 2 scoped: a one-line tuning change to
`kernel/sched/fair.c`, not a scheduling-logic rewrite.

## The change

```c
// kernel/sched/fair.c
- unsigned int sysctl_sched_base_slice			= 700000ULL;
+ unsigned int sysctl_sched_base_slice			= 300000ULL;
```

700µs → 300µs (chosen as a ~2.3x reduction: aggressive enough to be
measurable against benchmark noise, not so extreme that throughput
collapses under the correctness/stress tests in Phases 7-8).

## Complexity impact

None. `__pick_eevdf()` remains O(log n) in the number of runnable
entities on the runqueue; the constant only changes the numeric value
plugged into an existing formula (`deadline = vruntime + slice /
weight`), not the algorithm's shape.

## Memory impact

None. `sysctl_sched_base_slice` is a single existing `unsigned int`;
no new fields, no new allocations, no change to `struct sched_entity`
or `struct cfs_rq` layout.

## Correctness impact

- **Fairness invariant**: EEVDF's eligibility rule
  (`entity_eligible()`, based on lag relative to the runqueue average)
  is defined independently of the specific slice value — a smaller
  slice changes *how often* deadlines are recomputed, not *whether*
  the fairness accounting is sound. Every entity still accumulates
  vruntime proportional to its weight; long-run fairness is preserved.
- **No new code paths**: this is a constant change, not new logic —
  there is no new branch, lock, or allocation that could introduce a
  race, deadlock, or use-after-free.
- **Expected trade-off, not a regression**: throughput-sensitive
  workloads (more frequent context switches, more cache-line
  migration) may see a small throughput cost in exchange for the
  latency improvement. This is verified empirically in Phase 9
  (`context_switches_per_sec` is tracked specifically to catch this).
- **POSIX semantics** (`fork`/`wait`/`exec`/signals, Phase 8) are
  scheduling-*timing*-independent at the API level — a process still
  gets a PID, a parent still reaps it via `wait()`, `exec()` still
  replaces the image, signals still deliver — none of that logic lives
  in `kernel/sched/fair.c`. This change cannot plausibly break those
  semantics, only when-in-time each blocked step gets to run.
