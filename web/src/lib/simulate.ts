/**
 * Simulated demo mode — provides realistic fake output when the backend
 * is unreachable (e.g. on GitHub Pages). Every command/endpoint returns
 * plausible data so the UI is fully explorable without Docker.
 */

export const SIM_ENV = {
  status: "connected" as const,
  kernel: "6.8.0-137-generic",
  machine:
    "Linux kernel-sprint-lab 6.8.0-137-generic #137-Ubuntu SMP PREEMPT_DYNAMIC Fri Jul 17 19:15:13 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux",
  cpu: "2 cores",
  memory: "3.8Gi",
};

const FAKE_PS = `  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 root      20   0  169432  13308   8624 S   0.0   0.3   0:04.21 systemd
  234 root      20   0   83408   5532   4044 S   0.0   0.1   0:01.12 sshd
  312 root      20   0  104528   7620   5204 S   0.0   0.2   0:00.89 cron
  456 root      20   0  712432  42156  18432 S   1.2   1.1   0:07.33 dockerd
  789 root      20   0 1043816  68204  24576 S   2.4   1.7   0:12.55 containerd
 1024 root      20   0  234512  18944   9612 S   0.3   0.5   0:02.11 bpftrace
 1337 root      20   0   54320   3412   2104 R   0.1   0.1   0:00.04 ps`;

const FAKE_TOP = `top - 14:32:07 up 3 days, 11:24,  1 user,  load average: 1.24, 1.18, 1.05
Tasks: 142 total,   2 running, 139 sleeping,   0 stopped,   1 zombie
%Cpu(s): 12.4 us,  3.2 sy,  0.0 ni, 82.1 id,  1.8 wa,  0.0 hi,  0.5 si,  0.0 st
MiB Mem:   3891.2 total,   2341.5 used,   1549.7 free,    128.3 buffers
MiB Swap:      0.0 total,      0.0 used,      0.0 free.   1824.1 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
   1337 root      20   0   54320   3412   2104 R  12.5  0.1   0:00.04 top
    456 root      20   0  712432  42156  18432 S   3.1  1.1   0:07.33 dockerd
    789 root      20   0 1043816  68204  24576 S   2.4  1.7   0:12.55 containerd
   1024 root      20   0  234512  18944   9612 S   1.2  0.5   0:02.11 bpftrace
      1 root      20   0  169432  13308   8624 S   0.0  0.3   0:04.21 systemd`;

const FAKE_UNAME_A = `Linux kernel-sprint-lab 6.8.0-137-generic #137-Ubuntu SMP PREEMPT_DYNAMIC Fri Jul 17 19:15:13 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux`;

const FAKE_UNAME_R = `6.8.0-137-generic`;

const FAKE_NPROC = `2`;

const FAKE_FREE = `               total        used        free      shared  buff/cache   available
Mem:        3984384     1089536     1587200       128256      542400     1868416
Swap:             0           0           0`;

const FAKE_STRESS_CPU = `stress-ng: info:  [1] dispatching hogs: 2 cpu, 0 cpu, 0 matrix, 0 float, 0 fastmath, 0 variable
stress-ng: info:  [1] running for 5s, 2 workers, 300 stress iterations
stress-ng: info:  [1] successful run completed in 5.00s
stress-ng: info:  [1]   stressor      bogo ops real time  usr time  sys time
stress-ng: info:  [1]                 (secs)    (secs)    (secs)
stress-ng: info:  [1]   cpu            12450      5.00      7.82      1.94
stress-ng: info:  [1]   for a 5.00s wall clock time, the loader had a 0.0% load avg`;

const FAKE_STRESS_NG = `stress-ng: info:  [1] dispatching hogs: 2 cpu, 0 vm, 0 io, 0 fork, 0 semaphore
stress-ng: info:  [1] running for 5s, 2 workers, 300 stress iterations
stress-ng: info:  [1] successful run completed in 5.00s`;

export const SIMULATED_COMMANDS: Record<
  string,
  string | (() => string)
> = {
  "ps aux": FAKE_PS,
  ps: FAKE_PS,
  "top -bn1": FAKE_TOP,
  top: FAKE_TOP,
  "uname -a": FAKE_UNAME_A,
  "uname -r": FAKE_UNAME_R,
  nproc: FAKE_NPROC,
  "free -h": FAKE_FREE,
  "stress-ng --cpu 2 --timeout 5s": FAKE_STRESS_CPU,
  "stress-ng --cpu 2 -t 5": FAKE_STRESS_CPU,
  "stress-ng --cpu 8 --timeout 5s": FAKE_STRESS_CPU,
  "stress-ng --vm 1 --timeout 5s": FAKE_STRESS_NG,
  "stress-ng --fork 4 --timeout 5s": FAKE_STRESS_NG,
  "stress-ng --pthread 4 --timeout 5s": FAKE_STRESS_NG,
  hostname: "kernel-sprint-lab",
  whoami: "root",
  "cat /proc/version":
    "Linux version 6.8.0-137-generic (buildd@lcy02-amd64-045) (gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, GNU ld (GNU Binutils for Ubuntu) 2.42) #137-Ubuntu SMP PREEMPT_DYNAMIC Fri Jul 17 19:15:13 UTC 2026",
  "ls /sys/kernel/debug/sched/":
    "base_slice_ns  child_runnable_first  features  find_best_entity\nnoxps_numa /preempt  runqueues  tg_rt_interleave",
  "cat /sys/kernel/debug/sched/base_slice_ns": "4000000",
};

export function simulateCommand(cmd: string): string {
  // Try exact match
  if (SIMULATED_COMMANDS[cmd]) {
    const val = SIMULATED_COMMANDS[cmd];
    return typeof val === "function" ? val() : val;
  }
  // Try command prefix match (first word)
  const prefix = cmd.split(/\s+/)[0];
  if (SIMULATED_COMMANDS[prefix]) {
    const val = SIMULATED_COMMANDS[prefix];
    return typeof val === "function" ? val() : val;
  }
  // Generic fallback
  return `[simulated] command "${cmd}" executed successfully\n[simulated] This is a demo — connect to the backend for real execution.`;
}

/* ---- Simulated monitor metrics ---- */

export interface SimMetrics {
  context_switches_per_sec: number;
  wakeups_per_sec: number;
  cpu_pct: number;
  memory_pct: number;
  processes: { pid: string; name: string; cpu: string; mem: string }[];
}

let simBase = { switches: 12400, wakeups: 18600, cpu: 12.4, mem: 27.9 };

export function simulateMonitorMetrics(): SimMetrics {
  // Jitter around baseline
  const jitter = () => (Math.random() - 0.5) * 0.15;
  simBase.switches = Math.round(simBase.switches * (1 + jitter()));
  simBase.wakeups = Math.round(simBase.wakeups * (1 + jitter()));
  simBase.cpu = Math.max(1, Math.min(99, +(simBase.cpu * (1 + jitter())).toFixed(1)));
  simBase.mem = Math.max(1, Math.min(99, +(simBase.mem * (1 + jitter() * 0.5)).toFixed(1)));

  return {
    context_switches_per_sec: simBase.switches,
    wakeups_per_sec: simBase.wakeups,
    cpu_pct: simBase.cpu,
    memory_pct: simBase.mem,
    processes: [
      { pid: "456", name: "dockerd", cpu: "3.1", mem: "1.1" },
      { pid: "789", name: "containerd", cpu: "2.4", mem: "1.7" },
      { pid: "1024", name: "bpftrace", cpu: "1.2", mem: "0.5" },
      { pid: "1", name: "systemd", cpu: "0.0", mem: "0.3" },
    ],
  };
}

/* ---- Simulated experiment results ---- */

export function simulateExperimentResult(test: string): Record<string, unknown> {
  switch (test) {
    case "scheduler_optimization":
      return {
        type: "result",
        before: { mean_us: 420, p99_us: 850 },
        after: { mean_us: 210, p99_us: 420 },
        p99_improvement_pct: 50.6,
        note: "Simulated: toggled base_slice_ns from 4ms → 2ms. Real result shows similar ~50% p99 improvement.",
      };
    case "process_creation":
      return {
        type: "result",
        result: { mean_us: 38.2, p99_us: 112.4, forks_per_sec: 26178 },
      };
    case "context_switch":
      return {
        type: "result",
        result: { mean_us: 1.8, p99_us: 5.4, switches_per_sec: 148920 },
      };
    case "ipc_performance":
      return {
        type: "result",
        result: { throughput_mb_s: 2480, latency_us: 0.42 },
      };
    default:
      return { type: "result", result: { status: "ok" } };
  }
}

/* ---- Simulated chaos results ---- */

export interface SimChaosSample {
  type: "sample";
  message: string;
}

export interface SimChaosResult {
  type: "result";
  detected: boolean;
  detection_message: string;
  recommendation: string;
}

export function simulateChaos(action: string): {
  samples: SimChaosSample[];
  result: SimChaosResult;
} {
  switch (action) {
    case "cpu":
      return {
        samples: [
          { type: "sample", message: "cpu stress started, 2 workers, load 80%" },
          { type: "sample", message: "cpu bogo ops: 4520 (avg 2260/worker)" },
          { type: "sample", message: "cpu bogo ops: 9100 (avg 4550/worker)" },
          { type: "sample", message: "cpu bogo ops: 13800 (avg 6900/worker)" },
        ],
        result: {
          type: "result",
          detected: true,
          detection_message: "CPU load spike detected — 80% sustained across 2 cores for 5s",
          recommendation: "Normal under stress test. In production, check for runaway processes with `ps aux --sort=-%cpu | head`.",
        },
      };
    case "memory":
      return {
        samples: [
          { type: "sample", message: "vm stress started, 50% memory pressure" },
          { type: "sample", message: "memory allocated: 1.9Gi / 3.8Gi (50%)" },
          { type: "sample", message: "page faults: 12400/sec" },
        ],
        result: {
          type: "result",
          detected: true,
          detection_message: "Memory pressure detected — 50% allocation with elevated page faults",
          recommendation: "Check `dmesg | grep -i oom` for OOM killer activity. In production, set memory limits via cgroups.",
        },
      };
    case "disk":
      return {
        samples: [
          { type: "sample", message: "hdd stress started, 32MB bounded" },
          { type: "sample", message: "IOPS: 1420, throughput: 45.4 MB/s" },
          { type: "sample", message: "IOPS: 1380, throughput: 44.1 MB/s" },
        ],
        result: {
          type: "result",
          detected: false,
          detection_message: "Disk I/O within normal bounds — 45 MB/s sequential write",
          recommendation: "No action needed. For sustained high I/O, consider faster storage or I/O scheduling tuning.",
        },
      };
    case "network":
      return {
        samples: [
          { type: "sample", message: "tc netem delay added: 200ms on eth0" },
          { type: "sample", message: "ping RTT: 204ms (was 0.2ms)" },
          { type: "sample", message: "tcp RTT: 208ms, retransmits: 0" },
        ],
        result: {
          type: "result",
          detected: true,
          detection_message: "Network latency injected — 200ms delay on container interface",
          recommendation: "Use `tc qdisc del dev eth0 root` to remove. In production, set network policies via kubernetes network policies.",
        },
      };
    case "kill":
      return {
        samples: [
          { type: "sample", message: "spawned demo process pid=9999" },
          { type: "sample", message: "killing pid 9999 with SIGTERM" },
          { type: "sample", message: "process 9999 terminated (exit 143)" },
        ],
        result: {
          type: "result",
          detected: false,
          detection_message: "Process kill handled gracefully — SIGTERM → cleanup → exit 143",
          recommendation: "Always implement graceful shutdown handlers. SIGKILL should be a last resort.",
        },
      };
    default:
      return {
        samples: [{ type: "sample", message: "unknown action" }],
        result: {
          type: "result",
          detected: false,
          detection_message: "Unknown chaos action",
          recommendation: "Select a valid chaos scenario.",
        },
      };
  }
}

/* ---- Simulated benchmark results ---- */

export function simulateBenchmark(kernel: string): {
  process_creation: { mean_us: number; p99_us: number };
  context_switch: { switches_per_sec: number };
  scheduler_latency: { mean_us: number; p99_us: number };
} {
  if (kernel === "optimized") {
    return {
      process_creation: { mean_us: 38.2, p99_us: 112.4 },
      context_switch: { switches_per_sec: 14892 },
      scheduler_latency: { mean_us: 210, p99_us: 420 },
    };
  }
  return {
    process_creation: { mean_us: 52.7, p99_us: 184.3 },
    context_switch: { switches_per_sec: 15234 },
    scheduler_latency: { mean_us: 420, p99_us: 850 },
  };
}

/* ---- Simulated patch report ---- */

export function simulatePatchReport(): {
  data: {
    process_creation: { mean_us: number; p99_us: number };
    context_switch: { switches_per_sec: number };
    scheduler_latency: { mean_us: number; p99_us: number };
  };
  comparison_vs_baseline: Record<string, number>;
  note: string;
} {
  return {
    data: {
      process_creation: { mean_us: 38.2, p99_us: 112.4 },
      context_switch: { switches_per_sec: 14892 },
      scheduler_latency: { mean_us: 210, p99_us: 420 },
    },
    comparison_vs_baseline: {
      process_creation_mean_pct_change: -27.5,
      context_switch_pct_change: -2.2,
      scheduler_latency_p99_pct_change: -50.6,
    },
    note: "Simulated report: patch applied successfully, benchmarks show ~50% scheduler latency improvement.",
  };
}

/* ---- Simulated example patch ---- */

export const SIMULATED_EXAMPLE_PATCH = `--- a/kernel/sched/fair.c
+++ b/kernel/sched/fair.c
@@ -123,7 +123,7 @@
- * Default time slice for CFS tasks (4ms base).
+ * Optimized time slice for CFS tasks (2ms base).
  */
-#define CFS_BASE_SLICE_NS  4000000
+#define CFS_BASE_SLICE_NS  2000000
 
 /*
  * Minimum granularity to prevent starvation.

`;
