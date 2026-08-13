# Kernel Sprint — Linux Process Management Challenge

Analyze a Linux kernel process-management subsystem (Completely Fair Scheduler),
identify a measurable performance bottleneck, implement a kernel-level
optimization, and validate the improvement through benchmarking while
maintaining correctness and POSIX compliance.

See `CLAUDE.md` for the full project workflow (Phase 0–10) and the
companion interactive web platform requirements.

## Structure

- `kernel/` — Linux kernel source (cloned, not committed as a submodule yet)
- `patches/` — kernel patches produced by the project
- `benchmark/` — benchmark programs (process creation, context switch, scheduler latency)
- `scripts/` — helper scripts for building, tracing, and running benchmarks
- `results/` — baseline vs. optimized benchmark output
- `documentation/` — bottleneck analysis, design, and final performance report
