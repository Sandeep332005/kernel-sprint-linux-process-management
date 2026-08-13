import SchedulerCompare from "@/components/SchedulerCompare";
import LiveBenchmarkRunner from "@/components/LiveBenchmarkRunner";

export default function BenchmarkPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Benchmark Dashboard</h1>
      <p className="mt-2 text-zinc-400">
        Original kernel vs. optimized kernel, side by side — real data from
        3 boot-tested runs each.
      </p>
      <div className="mt-8 flex flex-col items-center gap-10">
        <SchedulerCompare />

        <div className="w-full max-w-xl">
          <h2 className="mb-3 font-mono text-sm uppercase tracking-wide text-zinc-500">
            Run it live
          </h2>
          <LiveBenchmarkRunner />
        </div>
      </div>
    </div>
  );
}
