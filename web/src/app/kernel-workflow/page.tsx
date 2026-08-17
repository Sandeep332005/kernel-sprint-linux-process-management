import KernelWorkflowDiagram from "@/components/KernelWorkflowDiagram";
import RealKernelWorkflow from "@/components/RealKernelWorkflow";
import PageHeader from "@/components/PageHeader";
import { WorkflowIcon } from "@/components/Icons";

export default function KernelWorkflowPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <PageHeader icon={<WorkflowIcon className="h-5 w-5" />} title="Kernel Workflow">
        <p>
          From source to a running kernel, and the path a process takes once
          it&apos;s up.
        </p>
      </PageHeader>

      <section className="mt-10">
        <h2 className="mb-4 font-mono text-sm uppercase tracking-wide text-zinc-500">
          Compilation pipeline
        </h2>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-8">
          <KernelWorkflowDiagram />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-mono text-sm uppercase tracking-wide text-zinc-500">
          Process lifecycle — live, driven by real kernel telemetry
        </h2>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-8">
          <RealKernelWorkflow />
        </div>
      </section>
    </div>
  );
}
