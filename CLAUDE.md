PROJECT: Kernel Sprint - Linux Process Management Challenge

MISSION:
Analyze a Linux kernel process-management subsystem, identify a measurable performance bottleneck, implement a kernel-level optimization, and validate improvement through benchmarking while maintaining correctness and POSIX compliance.

PROJECT RULES:
- Every optimization must have:
  1. Measurable problem
  2. Technical justification
  3. Kernel-level implementation
  4. Benchmark evidence
  5. Correctness verification

WORKFLOW:

PHASE 0: ENVIRONMENT SETUP

Tasks:
- Setup Linux kernel development environment
- Install compiler and build tools
- Install debugging tools
- Install benchmarking tools

Required:
gcc
make
git
perf
ftrace
trace-cmd
qemu
stress-ng


PHASE 1: KERNEL SOURCE PREPARATION

Tasks:
- Clone Linux kernel source
- Select stable kernel version
- Create development branch

Output:
- Kernel source
- Git branch


PHASE 2: SELECT SUBSYSTEM

Recommended:
Linux Completely Fair Scheduler (CFS)

Location:
kernel/sched/

Important files:
kernel/sched/core.c
kernel/sched/fair.c
kernel/sched/sched.h

Alternative:
Process creation:
kernel/fork.c

Context switching:
kernel/sched/core.c


PHASE 3: PERFORMANCE ANALYSIS

Create benchmarks:

benchmark/process_creation.c
benchmark/context_switch.c
benchmark/scheduler_latency.c

Use:

perf:
perf sched record ./benchmark

ftrace:
sched_switch
sched_wakeup

trace-cmd:
trace-cmd record


Store:

results/baseline/


PHASE 4: BOTTLENECK IDENTIFICATION

Create:

documentation/bottleneck-analysis.md

Include:
- Problem description
- Measurement results
- Kernel function involved
- Root cause


PHASE 5: OPTIMIZATION DESIGN

Create:

documentation/design.md

Explain:

Current flow:
User Process
    |
System Call
    |
Kernel Scheduler
    |
CPU


Optimized flow:
User Process
    |
Optimized Scheduler
    |
CPU


Explain:
- Complexity improvement
- Memory impact
- Correctness impact


PHASE 6: KERNEL IMPLEMENTATION

Requirements:
- Follow Linux coding style
- Modify minimum required files
- Maintain compatibility

Output:

patches/scheduler-optimization.patch


Build:

make menuconfig
make -j$(nproc)


Verify:
- Kernel builds
- Kernel boots
- No kernel panic


PHASE 7: CORRECTNESS TESTING

Run:

stress-ng --fork 100

stress-ng --pthread 100

stress-ng --cpu 8


Check:
- No crash
- No deadlock
- No starvation


PHASE 8: POSIX VALIDATION

Test:

fork()
- Parent receives child PID
- Child receives zero


wait()
- Parent waits correctly


exec()
- Process replacement works


Signals:
- SIGTERM
- SIGKILL


PHASE 9: BENCHMARK COMPARISON

Compare:

Original Kernel

VS

Optimized Kernel


Measure:

- Scheduler latency
- Context switches
- Fork time
- CPU utilization


Save:

results/baseline/
results/optimized/


PHASE 10: FINAL REPORT

Create:

documentation/performance-report.md


Include:

1. Introduction
2. Problem statement
3. Bottleneck analysis
4. Optimization method
5. Implementation details
6. Benchmark results
7. Correctness testing
8. POSIX compliance
9. Future improvements


FINAL PROJECT STRUCTURE:

Kernel-Sprint/

kernel/
patches/
benchmark/
scripts/
results/
documentation/
README.md
CLAUDE.md


FINAL CHECKLIST:

[x] Linux subsystem analyzed (documentation/subsystem-selection.md)

[x] Performance bottleneck measured (documentation/bottleneck-analysis.md)

[x] Kernel optimization implemented (patches/scheduler-optimization.patch)

[x] Benchmark comparison completed (results/optimized/results.md)

[x] Correctness verified (results/*-correctness/correctness.log)

[x] POSIX compliance verified (results/*-correctness/correctness.log)

See documentation/performance-report.md for the full synthesis.


CLAUDE WORKING STYLE:

For every task:

1. Explain objective
2. Explain importance
3. Implement step-by-step
4. Validate result
5. Record evidence
6. Continue only after verification


Never:
- Skip benchmarking
- Claim improvement without data
- Modify kernel code without explanation ====================================================

WEB PLATFORM REQUIREMENTS

PROJECT WEBSITE OBJECTIVE:

Build an interactive Linux Kernel Sprint learning and testing platform.

The website must not be a static documentation page.

It must provide:

- Full animated artifacts
- Interactive architecture diagrams
- Live environment setup guides
- Practical execution workflows
- Real-time testing demonstrations
- Benchmark visualization
- Kernel optimization explanation


====================================================

WEBSITE EXPERIENCE REQUIREMENTS


1. FULL ANIMATED ARTIFACTS


Every important concept must have an animated visualization.


Required animations:


A. Linux Process Lifecycle Animation


Show:

User Program

      |
      v

System Call

      |
      v

Kernel

      |
      v

Process Scheduler

      |
      v

CPU Execution


Animation:

- Process creation animation
- Context switch animation
- Scheduler decision animation
- CPU execution timeline


----------------------------------------------------


B. Scheduler Visualization


Show:


Before Optimization:

Runnable Queue

      |
      v

Scheduler Search

      |
      v

Select Process


After Optimization:

Runnable Queue

      |
      v

Fast Lookup

      |
      v

Select Process


Animation must show:

- Latency reduction
- Algorithm improvement
- Execution path


----------------------------------------------------


C. Kernel Compilation Workflow Animation


Show:


Source Code

      |
      v

Configuration

      |
      v

Compilation

      |
      v

Kernel Image

      |
      v

Bootloader

      |
      v

Running Kernel


====================================================

LIVE ENVIRONMENT SETUP GUIDE


The website must provide complete practical setup instructions.


Supported environments:


1. Ubuntu Linux

2. Ubuntu Virtual Machine

3. Docker Container

4. WSL2

5. QEMU Kernel Testing

6. Cloud Linux Instance


----------------------------------------------------


Environment Page Structure:


Each environment must contain:


Step 1:
Requirements


Example:

CPU:
4 cores minimum

RAM:
8GB minimum

Storage:
50GB minimum


----------------------------------------------------


Step 2:
Install Dependencies


Example:


sudo apt update


sudo apt install:

gcc

make

git

perf

trace-cmd

qemu

stress-ng


----------------------------------------------------


Step 3:
Verify Installation


Show live commands:


gcc --version

make --version

perf --version


Expected output must be displayed.


----------------------------------------------------


Step 4:
Kernel Download


Show:


git clone Linux kernel


Checkout version


Create branch


----------------------------------------------------


Step 5:
Build Kernel


Interactive terminal:


make menuconfig

make -j$(nproc)


Show:

Compilation progress animation.


----------------------------------------------------


Step 6:
Boot Testing


Demonstrate:


QEMU boot


or


GRUB boot


Show:

Kernel version

uname -r


====================================================

LIVE PRACTICAL TESTING PLATFORM


The website must provide browser-based practical demonstrations.


Features:


1. Terminal Simulator


Users can execute:

- kernel commands
- benchmark commands
- analysis commands


Example:


perf sched latency


stress-ng --cpu 8


trace-cmd report


----------------------------------------------------


2. Benchmark Dashboard


Display:


Before Optimization:


Scheduler latency:

850 microseconds


Context switches:

15000/sec



After Optimization:


Scheduler latency:

420 microseconds


Context switches:

15000/sec


Show:

- animated graphs
- comparison charts
- improvement percentage


----------------------------------------------------


3. Kernel Patch Testing


Workflow:


Upload Patch

        |

        v

Apply Patch

        |

        v

Build Kernel

        |

        v

Run Benchmark

        |

        v

Generate Report



====================================================

INTERACTIVE DOCUMENTATION


Every technical topic must include:


1. Concept explanation

2. Animated diagram

3. Practical commands

4. Expected output

5. Troubleshooting

6. Benchmark result


Example:


Topic:

Context Switching


Include:


Theory:

What is context switching?


Animation:

CPU changing from Process A to Process B


Practical:

perf sched record


Output:

Scheduler timeline


====================================================

ARTIFACT REQUIREMENTS


All project artifacts must be interactive.


Required artifacts:


1. Architecture diagrams

Format:

Animated SVG / Canvas / WebGL


2. Kernel workflow diagrams


3. Benchmark dashboards


4. Terminal demonstrations


5. Before vs After comparison


6. Kernel source navigation


7. Performance graphs


====================================================

TECH STACK FOR WEBSITE


Frontend:

React / Next.js

TailwindCSS

Framer Motion

Three.js (for advanced visualization)


Backend:

FastAPI / Node.js


Database:

PostgreSQL / SQLite


Visualization:

D3.js

Chart.js


Terminal:

WebSocket based Linux sandbox


====================================================

FINAL WEBSITE SECTIONS


/

Landing page


/features

Project capabilities


/kernel-workflow

Animated kernel workflow


/setup

Environment setup guides


/lab

Interactive practical lab


/benchmark

Live performance comparison


/patch

Kernel optimization changes


/results

Benchmark reports


/docs

Complete documentation



====================================================

CLAUDE DEVELOPMENT RULE


When creating any website feature:

1. Explain purpose.
2. Create UI design.
3. Add animation.
4. Add practical example.
5. Add live testing capability.
6. Validate functionality.

Never create static pages.

Every concept must have:
- Visual explanation
- Practical execution
- Measurable result
