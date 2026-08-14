import ExperimentsPanel from "@/components/ExperimentsPanel";

export default function ExperimentsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Experiments</h1>
      <p className="mt-2 text-zinc-400">
        Real, parameterized tests against the sandbox container&apos;s own
        kernel — fast (seconds), since they don&apos;t need a full QEMU boot
        like the patch pipeline.
      </p>
      <div className="mt-10">
        <ExperimentsPanel />
      </div>
    </div>
  );
}
