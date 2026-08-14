import SchedulerCompare from "@/components/SchedulerCompare";
import LiveBenchmarkRunner from "@/components/LiveBenchmarkRunner";
import PageHeader from "@/components/PageHeader";
import { BenchmarkIcon } from "@/components/Icons";

export default function BenchmarkPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <PageHeader icon={<BenchmarkIcon className="h-5 w-5" />} title="Benchmark Dashboard">
        <p>
          Original kernel vs. optimized kernel, side by side — real data from
          3 boot-tested runs each.
        </p>
      </PageHeader>
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
