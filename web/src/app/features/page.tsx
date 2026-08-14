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
    icon: LabIcon,
    title: "Interactive lab + eBPF monitoring",
    body: "A real sandboxed terminal (perf, trace-cmd, stress-ng, ps, top, uname) plus a live bpftrace dashboard of sched_switch/wakeup counts, CPU%, memory%, and top processes.",
    live: true,
    span: true,
  },
  {
    icon: PatchIcon,
    title: "Patch pipeline",
    body: "Upload a real unified diff — applied, built, booted under QEMU, benchmarked, and compared against baseline. Nothing here is simulated.",
    live: true,
  },
  {
    icon: BenchmarkIcon,
    title: "Benchmark dashboard",
    body: "Real 3-run before/after comparison from actual boot-tested kernels, plus an on-demand live pipeline that boots either kernel and re-measures right now.",
    live: true,
  },
  {
    icon: ExperimentsIcon,
    title: "Experiments",
    body: "Four fast, parameterized tests against the sandbox's own kernel, including a genuine before/after that toggles a live-tunable scheduler knob.",
    live: true,
  },
  {
    icon: ChaosIcon,
    title: "Failure injection",
    body: "Real CPU/memory/disk stress, network delay, and process kill — all confined to the sandbox container's own namespaces, verified unable to reach the host.",
    live: true,
  },
  {
    icon: WorkflowIcon,
    title: "Animated architecture diagrams",
    body: "The process-lifecycle diagram is paced by real bpftrace telemetry ticks, not a fixed timer.",
  },
  {
    icon: OrchestrateIcon,
    title: "System architecture",
    body: "An honest diagram of what was actually built, including where it deliberately diverges from the spec's aspirational design.",
  },
  {
    icon: SetupIcon,
    title: "Live environment setup",
    body: "The real steps this project used — Colima VM, arm64 build, QEMU boot — not a generic example.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <PageHeader icon={<FeaturesIcon className="h-5 w-5" />} title="Capabilities">
        <p>
          What this platform does beyond static documentation.{" "}
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
          </span>{" "}
          marks pages backed by a real running backend, not prose.
        </p>
      </PageHeader>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className={`rounded-lg border border-zinc-800 bg-zinc-950 p-5 ${
              f.span ? "lg:col-span-2" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <f.icon className="h-5 w-5 shrink-0 text-emerald-400" />
                <h2 className="font-medium text-emerald-400">{f.title}</h2>
              </div>
              {f.live && (
                <span className="flex items-center gap-1 rounded-full border border-emerald-900 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-zinc-400">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
