# Phase 2 — Subsystem Selection

## Subsystem

Linux Completely Fair Scheduler (CFS), specifically the **EEVDF**
(Earliest Eligible Virtual Deadline First) picking path that replaced
classic CFS as of kernel 5.14+/6.6. Source: `kernel/sched/fair.c`.

## Why not the raw pick_eevdf() algorithm itself

`__pick_eevdf()` (fair.c:881) is already an O(log n) augmented-rbtree
search (tracks `min_deadline` per subtree as a heap alongside the
vruntime-ordered tree). Rewriting that algorithm to be meaningfully
"faster" without deep scheduler-maintainer-level expertise risks
introducing subtle fairness or livelock bugs that would not show up in
a short benchmark run but would matter in production. That's a bad
trade for this project's correctness requirements.

## Target: `sysctl_sched_base_slice`

```c
// kernel/sched/fair.c:78
unsigned int sysctl_sched_base_slice = 700000ULL;   // 700 microseconds
```

This is the "requested" time slice used to compute each sched_entity's
virtual deadline (`deadline = vruntime + slice / weight`, see
`place_entity()` and `update_deadline()`). It directly controls the
latency/throughput trade-off EEVDF makes:

- **Larger slice** → longer deadlines → tasks wait longer to become
  eligible to preempt → higher wake-up latency, but fewer context
  switches (better cache locality, higher throughput for CPU-bound work).
- **Smaller slice** → shorter deadlines → newly woken tasks become
  eligible sooner → lower wake-up latency, at the cost of more frequent
  context switches.

This is a real, bounded, safe optimization target:

1. **Measurable problem**: wake-up latency under load, measured directly
   by `benchmark/scheduler_latency.c` and `benchmark/context_switch.c`.
2. **Technical justification**: EEVDF's own deadline formula makes the
   latency/throughput trade-off explicit and linear in this constant —
   no guesswork about mechanism.
3. **Kernel-level implementation**: a genuine one-line change to
   `kernel/sched/fair.c`, not a userspace sysctl poke, so it's part of
   the kernel image itself and requires a rebuild — matching Phase 6's
   "kernel-level implementation" requirement.
4. **Benchmark evidence**: directly comparable before/after via the
   same benchmark binaries run against the baseline and patched kernel.
5. **Correctness verification**: the change alters a tuning constant,
   not scheduling logic — the EEVDF algorithm, eligibility rules, and
   fairness invariants are untouched, so `fork`/`wait`/`exec`/signal
   semantics and CFS fairness guarantees are structurally unaffected.
   This is the same class of change real-world low-latency kernel
   configs make (c.f. `sysctl_sched_min_granularity_ns` tuning in
   pre-EEVDF kernels for audio/gaming workloads).

## Environment note: target architecture

The project's own setup examples (`documentation/environment-setup.md`,
website `/setup` page) assume x86_64 (`arch/x86/boot/bzImage`,
`qemu-system-x86_64`). The actual `kernel-sprint` Colima VM runs on
Apple Silicon, i.e. **aarch64**. Building for x86_64 from here would
require a cross-compilation toolchain neither installed nor requested.
Building and boot-testing natively for **arm64** instead is faster, uses
the toolchain already verified in Phase 0, and — since the target is a
scheduler tuning constant, not architecture-specific code — the
optimization and its correctness argument are identical on either
architecture. This is documented here as a deliberate adaptation, not
an oversight.
