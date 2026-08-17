import PageHeader from "@/components/PageHeader";
import { DocsIcon, WorkflowIcon, BenchmarkIcon, ForkIcon, TraceIcon } from "@/components/Icons";

const topics = [
  {
    name: "EEVDF Scheduler",
    icon: WorkflowIcon,
    theory:
      "Kernel 6.6+ replaced classic CFS's \"pick smallest vruntime\" with EEVDF: pick the earliest eligible virtual deadline. Eligibility and deadline both derive from sysctl_sched_base_slice — see kernel/sched/fair.c:__pick_eevdf().",
    command: "cat /sys/kernel/debug/sched/base_slice_ns",
    output: "The live-tunable slice this project's patch (and the Experiments page) actually changes.",
  },
  {
    name: "Context Switching",
    icon: BenchmarkIcon,
    theory: "The CPU saves the state of one process and loads another.",
    command: "perf sched record",
    output: "Scheduler timeline (perf sched report) — see results/baseline/perf-sched-latency.txt for a real capture.",
  },
  {
    name: "Process Creation (fork)",
    icon: ForkIcon,
    theory: "fork() duplicates the calling process into parent and child.",
    command: "strace -f -e trace=fork,clone ./benchmark",
    output: "Parent gets child PID, child gets 0 — verified in benchmark/posix_validation.c.",
  },
  {
    name: "eBPF tracepoints",
    icon: TraceIcon,
    theory: "bpftrace attaches to kernel tracepoints (sched:sched_switch, sched:sched_wakeup) without loading a kernel module.",
    command: "bpftrace -e 'tracepoint:sched:sched_switch { @c = count(); }'",
    output: "Real counts, live on the Lab page's monitoring panel.",
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <PageHeader icon={<DocsIcon className="h-5 w-5" />} title="Documentation">
        <p>Theory, practical commands, and expected output for each topic.</p>
      </PageHeader>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {topics.map((t) => (
          <div
            key={t.name}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5"
          >
            <div className="flex items-center gap-2.5">
              <t.icon className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-medium text-emerald-600 dark:text-emerald-400">{t.name}</h2>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t.theory}</p>
            <pre className="mt-3 overflow-x-auto rounded bg-white dark:bg-black p-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
              $ {t.command}
            </pre>
            <p className="mt-2 text-xs text-zinc-500">Expected: {t.output}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
