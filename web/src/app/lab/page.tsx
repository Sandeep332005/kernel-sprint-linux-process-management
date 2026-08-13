import TerminalSimulator from "@/components/TerminalSimulator";

export default function LabPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Interactive Lab</h1>
      <p className="mt-2 text-zinc-400">
        Run benchmark and analysis commands. Currently a client-side stub —
        swap in a WebSocket-backed Linux sandbox (see the kernel-sprint
        Colima VM) to execute these for real.
      </p>
      <div className="mt-8">
        <TerminalSimulator />
      </div>
    </div>
  );
}
