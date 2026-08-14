import RealTerminal from "@/components/RealTerminal";
import LiveMonitor from "@/components/LiveMonitor";
import PageHeader from "@/components/PageHeader";
import { LabIcon } from "@/components/Icons";

export default function LabPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <PageHeader icon={<LabIcon className="h-5 w-5" />} title="Interactive Lab">
        <p>
          Real commands, really executed — inside the sandboxed
          kernel-sprint-env container, never on the host.
        </p>
      </PageHeader>
      <div className="mt-8 space-y-8">
        <RealTerminal />
        <LiveMonitor />
      </div>
    </div>
  );
}
