import ExperimentsPanel from "@/components/ExperimentsPanel";
import PageHeader from "@/components/PageHeader";
import { ExperimentsIcon } from "@/components/Icons";

export default function ExperimentsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <PageHeader icon={<ExperimentsIcon className="h-5 w-5" />} title="Experiments">
        <p>
          Real, parameterized tests against the sandbox container&apos;s own
          kernel — fast (seconds), since they don&apos;t need a full QEMU
          boot like the patch pipeline.
        </p>
      </PageHeader>
      <div className="mt-10">
        <ExperimentsPanel />
      </div>
    </div>
  );
}
