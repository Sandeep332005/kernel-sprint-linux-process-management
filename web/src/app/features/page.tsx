const features = [
  {
    title: "Animated architecture diagrams",
    body: "Process lifecycle, scheduler decision path, and kernel compilation flow, all animated rather than static screenshots.",
  },
  {
    title: "Live environment setup",
    body: "Step-by-step guides for Ubuntu, VM, Docker, WSL2, QEMU, and cloud instances, with copy-pasteable commands and expected output.",
  },
  {
    title: "Interactive lab",
    body: "A browser terminal for running benchmark and analysis commands against the kernel-sprint environment.",
  },
  {
    title: "Benchmark dashboard",
    body: "Before/after scheduler latency, context switches, and fork time, visualized with animated comparison charts.",
  },
  {
    title: "Patch workflow",
    body: "Upload a patch, apply it, rebuild, rerun benchmarks, and generate a report — one pipeline.",
  },
  {
    title: "Interactive documentation",
    body: "Every topic pairs theory with an animated diagram, a practical command, and a real benchmark result.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Capabilities</h1>
      <p className="mt-2 text-zinc-400">
        What this platform does beyond static documentation.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-lg border border-zinc-800 bg-zinc-950 p-5"
          >
            <h2 className="font-medium text-emerald-400">{f.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
