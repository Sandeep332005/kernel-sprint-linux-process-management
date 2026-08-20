# Kernel Sprint — Linux Process Management Challenge

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?logo=github)](https://sandeep332005.github.io/kernel-sprint-linux-process-management/)

> **Interactive website &rarr; [sandeep332005.github.io/kernel-sprint-linux-process-management](https://sandeep332005.github.io/kernel-sprint-linux-process-management/)**

Analyze a Linux kernel process-management subsystem (Completely Fair Scheduler),
identify a measurable performance bottleneck, implement a kernel-level
optimization, and validate the improvement through benchmarking while
maintaining correctness and POSIX compliance.

See `CLAUDE.md` for the full project workflow (Phase 0–10) and the
companion interactive web platform requirements.

## Live Demo

The interactive website is deployed to **GitHub Pages** and is publicly accessible:

- **Landing page** — project overview, animated process lifecycle, architecture entry points
- **Orchestrate** — system architecture diagram with Mermaid-style tree
- **Kernel Workflow** — live-telemetry-paced process lifecycle animation
- **Setup** — environment setup guides (Ubuntu, Docker, WSL2, QEMU, cloud)
- **Docs** — EEVDF scheduler, eBPF tracing, and optimization explanation
- **Benchmark** — before/after scheduler comparison charts with real data
- **Results** — captured benchmark report with improvement percentages
- **Features** — full feature gallery

Pages that require the local backend (Lab terminal, Patch runner, Chaos injection,
Experiments) will show a "Disconnected" state when accessed without the backend.
To run the full interactive experience locally, see the [Setup](#quick-start) section.

## Quick Start

```bash
# Frontend (interactive website)
cd web && npm install && npm run dev    # opens at http://localhost:4477

# Backend (orchestrator — requires Docker)
cd backend && pip install -r requirements.txt && python main.py

# Full stack with Docker
docker compose up --build
```

## Structure

- `kernel/` — Linux kernel source (cloned, not committed as a submodule yet)
- `patches/` — kernel patches produced by the project
- `benchmark/` — benchmark programs (process creation, context switch, scheduler latency)
- `scripts/` — helper scripts for building, tracing, and running benchmarks
- `results/` — baseline vs. optimized benchmark output
- `documentation/` — bottleneck analysis, design, and final performance report
