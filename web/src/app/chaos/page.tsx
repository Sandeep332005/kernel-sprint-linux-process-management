import ChaosPanel from "@/components/ChaosPanel";

export default function ChaosPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Failure Injection</h1>
      <p className="mt-2 text-zinc-400">
        Real stress-ng, tc netem, and kill — but every one of these is
        confined to the disposable sandbox container&apos;s own cgroup, PID
        namespace, and network interface. None of it can reach the host,
        regardless of the container running --privileged.
      </p>
      <div className="mt-10">
        <ChaosPanel />
      </div>
    </div>
  );
}
