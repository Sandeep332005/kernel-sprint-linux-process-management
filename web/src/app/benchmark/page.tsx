import SchedulerCompare from "@/components/SchedulerCompare";

export default function BenchmarkPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Benchmark Dashboard</h1>
      <p className="mt-2 text-zinc-400">
        Original kernel vs. optimized kernel, side by side.
      </p>
      <div className="mt-8 flex justify-center">
        <SchedulerCompare />
      </div>
    </div>
  );
}
