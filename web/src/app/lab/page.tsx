import RealTerminal from "@/components/RealTerminal";
import LiveMonitor from "@/components/LiveMonitor";

export default function LabPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Interactive Lab</h1>
      <p className="mt-2 text-zinc-400">
        Real commands, really executed — inside the sandboxed
        kernel-sprint-env container, never on the host. Start the backend
        with <code className="text-zinc-300">backend/main.py</code> (see
        README) for this to connect.
      </p>
      <div className="mt-8 space-y-8">
        <RealTerminal />
        <LiveMonitor />
      </div>
    </div>
  );
}
