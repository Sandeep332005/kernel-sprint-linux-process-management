import ArchitectureDiagram from "@/components/ArchitectureDiagram";

const deviations = [
  {
    spec: "PostgreSQL + Time Series data store",
    actual: "Static JSON (backend/data/results.json) and git-committed markdown reports. There's no live database — captured results are files, versioned like code.",
  },
  {
    spec: "Kernel Agent / Benchmark Engine / Data Store / Result Processor as separate services",
    actual: "Six Python modules (agents/*.py) running inside one FastAPI process. No message queue, no inter-service network calls — simpler, and there was no real need for separate services at this scale.",
  },
  {
    spec: "Linux Agent / VM Agent / Docker Agent (plural, pluggable)",
    actual: "One docker_agent.py talking to one disposable --privileged container. Multi-backend pluggability was never needed since everything runs through the same sandboxed Docker container.",
  },
];

export default function OrchestratePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">System Architecture</h1>
      <p className="mt-2 text-zinc-400">
        How a command typed in the browser actually reaches a real sandboxed
        kernel — every layer below is real code, not a design placeholder.
      </p>

      <div className="mt-10 rounded-lg border border-zinc-800 bg-zinc-950 p-8">
        <ArchitectureDiagram />
      </div>

      <section className="mt-12">
        <h2 className="mb-4 font-mono text-sm uppercase tracking-wide text-zinc-500">
          Where this diverges from the original spec
        </h2>
        <div className="space-y-4">
          {deviations.map((d) => (
            <div key={d.spec} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <p className="font-mono text-xs text-zinc-500">Spec said:</p>
              <p className="text-sm text-zinc-300">{d.spec}</p>
              <p className="mt-2 font-mono text-xs text-emerald-500">What actually exists:</p>
              <p className="text-sm text-zinc-400">{d.actual}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          None of this was a shortcut taken silently — each simplification was
          chosen because the fuller version wasn&apos;t needed at this scale,
          not because it was skipped.
        </p>
      </section>
    </div>
  );
}
