import PatchRunner from "@/components/PatchRunner";

export default function PatchPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Kernel Patch Testing</h1>
      <p className="mt-2 text-zinc-400">
        Upload a real unified diff. It gets applied to a scratch copy of the
        kernel source, built, booted under QEMU, benchmarked, and compared
        against the captured baseline — nothing here is simulated. A full
        run takes several minutes (the build itself is the slow part).
      </p>
      <p className="mt-2 text-sm text-amber-500">
        Avoid running other CPU-heavy work on this machine while a run is in
        progress — the QEMU guest shares physical cores with the host, so
        host load shows up as scheduler-latency noise unrelated to the patch
        (observed once: a concurrent build inflated p99 30x vs. an isolated
        re-run of the identical patch).
      </p>
      <div className="mt-10">
        <PatchRunner />
      </div>
    </div>
  );
}
