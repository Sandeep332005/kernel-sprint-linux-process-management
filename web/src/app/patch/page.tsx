const pipeline = [
  "Upload Patch",
  "Apply Patch",
  "Build Kernel",
  "Run Benchmark",
  "Generate Report",
];

export default function PatchPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Kernel Patch Testing</h1>
      <p className="mt-2 text-zinc-400">
        Upload a patch from <code className="text-zinc-300">patches/</code>{" "}
        and run it through the pipeline. Wiring this to the real build in the
        kernel-sprint VM is a backend task, not yet implemented.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        {pipeline.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <div className="rounded-md border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm">
              {step}
            </div>
            {i < pipeline.length - 1 && (
              <span className="text-zinc-600">→</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-lg border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
        Patch upload UI placeholder
      </div>
    </div>
  );
}
