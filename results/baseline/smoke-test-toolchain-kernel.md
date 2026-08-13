# Benchmark harness smoke test

Run against the `kernel-sprint-env` container's own host kernel
(Ubuntu `6.8.0-117-generic`, aarch64) — this is **not** the Phase 3
baseline. It exists only to confirm the three benchmark programs
compile and produce sane numbers before being run inside the actual
QEMU-booted custom kernel (see `results/baseline/` for the real
baseline once available).

```
=== process_creation ===
benchmark=process_creation iterations=5000
mean_us=90.054 min_us=60.000 max_us=3037.333 p50_us=81.750 p99_us=166.750

=== context_switch ===
benchmark=context_switch round_trips=20000
round_trip_us=28.484 context_switch_us=14.242 context_switches_per_sec=70216

=== scheduler_latency ===
benchmark=scheduler_latency iterations=500 interval_us=2000 ncpus=4
mean_us=54.853 min_us=54.229 max_us=106.154 p50_us=54.432 p99_us=63.902
```
