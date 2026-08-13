export default function ResultsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Benchmark Reports</h1>
      <p className="mt-2 text-zinc-400">
        Populate this list from{" "}
        <code className="text-zinc-300">results/baseline/</code> and{" "}
        <code className="text-zinc-300">results/optimized/</code> once real
        benchmark runs exist.
      </p>
      <div className="mt-10 rounded-lg border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
        No benchmark runs recorded yet.
      </div>
    </div>
  );
}
