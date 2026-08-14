import {
  WorkflowIcon,
  SetupIcon,
  LabIcon,
  BenchmarkIcon,
  PatchIcon,
  ExperimentsIcon,
  ChaosIcon,
  OrchestrateIcon,
  FeaturesIcon,
} from "@/components/Icons";
import PageHeader from "@/components/PageHeader";

const features = [
  {
    icon: WorkflowIcon,
    title: "Animated architecture diagrams",
    body: "Process lifecycle, scheduler decision path, and kernel compilation flow — the process-lifecycle diagram is now paced by real bpftrace telemetry ticks, not a fixed timer.",
  },
  {
    icon: SetupIcon,
    title: "Live environment setup",
    body: "Step-by-step guides for Ubuntu, VM, Docker, WSL2, QEMU, and cloud instances, with copy-pasteable commands and expected output.",
  },
  {
    icon: LabIcon,
    title: "Interactive lab + eBPF monitoring",
    body: "A real sandboxed terminal (perf, trace-cmd, stress-ng, ps, top, uname) plus a live bpftrace dashboard of sched_switch/wakeup counts, CPU%, memory%, and top processes.",
  },
  {
    icon: BenchmarkIcon,
    title: "Benchmark dashboard",
    body: "Real 3-run before/after comparison from actual boot-tested kernels, plus an on-demand live pipeline that boots either kernel and re-measures right now.",
  },
  {
    icon: PatchIcon,
    title: "Patch pipeline",
    body: "Upload a real unified diff — applied, built, booted under QEMU, benchmarked, and compared against baseline. Nothing here is simulated.",
  },
  {
    icon: ExperimentsIcon,
    title: "Experiments",
    body: "Four fast, parameterized tests against the sandbox's own kernel, including a genuine before/after that toggles a live-tunable scheduler knob.",
  },
  {
    icon: ChaosIcon,
    title: "Failure injection",
    body: "Real CPU/memory/disk stress, network delay, and process kill — all confined to the sandbox container's own namespaces, verified unable to reach the host.",
  },
  {
    icon: OrchestrateIcon,
    title: "System architecture",
    body: "An honest diagram of what was actually built, including where it deliberately diverges from the original spec's aspirational design.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <PageHeader icon={<FeaturesIcon className="h-5 w-5" />} title="Capabilities">
        <p>What this platform does beyond static documentation.</p>
      </PageHeader>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-lg border border-zinc-800 bg-zinc-950 p-5"
          >
            <div className="flex items-center gap-2.5">
              <f.icon className="h-5 w-5 shrink-0 text-emerald-400" />
              <h2 className="font-medium text-emerald-400">{f.title}</h2>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
