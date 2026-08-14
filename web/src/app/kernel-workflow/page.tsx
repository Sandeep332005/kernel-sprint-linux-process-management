import KernelWorkflowDiagram from "@/components/KernelWorkflowDiagram";
import RealKernelWorkflow from "@/components/RealKernelWorkflow";

export default function KernelWorkflowPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Kernel Workflow</h1>
      <p className="mt-2 text-zinc-400">
        From source to a running kernel, and the path a process takes once
        it's up.
      </p>

      <section className="mt-10">
        <h2 className="mb-4 font-mono text-sm uppercase tracking-wide text-zinc-500">
          Compilation pipeline
        </h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8">
          <KernelWorkflowDiagram />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-mono text-sm uppercase tracking-wide text-zinc-500">
          Process lifecycle — live, driven by real kernel telemetry
        </h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8">
          <RealKernelWorkflow />
        </div>
      </section>
    </div>
  );
}
