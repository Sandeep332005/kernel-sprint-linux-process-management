const topics = [
  {
    name: "Context Switching",
    theory: "The CPU saves the state of one process and loads another.",
    command: "perf sched record",
    output: "Scheduler timeline (perf sched report)",
  },
  {
    name: "Process Creation (fork)",
    theory: "fork() duplicates the calling process into parent and child.",
    command: "strace -f -e trace=fork,clone ./benchmark",
    output: "Parent gets child PID, child gets 0",
  },
  {
    name: "CFS Scheduler",
    theory:
      "The Completely Fair Scheduler picks the runnable task with the smallest vruntime.",
    command: "cat /sys/kernel/debug/sched/debug",
    output: "Per-CPU runqueue state",
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Documentation</h1>
      <p className="mt-2 text-zinc-400">
        Theory, practical commands, and expected output for each topic.
      </p>
      <div className="mt-10 space-y-6">
        {topics.map((t) => (
          <div
            key={t.name}
            className="rounded-lg border border-zinc-800 bg-zinc-950 p-5"
          >
            <h2 className="font-medium text-emerald-400">{t.name}</h2>
            <p className="mt-2 text-sm text-zinc-400">{t.theory}</p>
            <pre className="mt-3 overflow-x-auto rounded bg-black p-3 font-mono text-xs text-zinc-300">
              $ {t.command}
            </pre>
            <p className="mt-2 text-xs text-zinc-500">Expected: {t.output}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
