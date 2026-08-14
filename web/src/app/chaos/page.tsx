import ChaosPanel from "@/components/ChaosPanel";
import PageHeader from "@/components/PageHeader";
import { ChaosIcon } from "@/components/Icons";

export default function ChaosPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <PageHeader icon={<ChaosIcon className="h-5 w-5" />} title="Failure Injection">
        <p>
          Real stress-ng, tc netem, and kill — but every one of these is
          confined to the disposable sandbox container&apos;s own cgroup,
          PID namespace, and network interface. None of it can reach the
          host, regardless of the container running --privileged.
        </p>
      </PageHeader>
      <div className="mt-10">
        <ChaosPanel />
      </div>
    </div>
  );
}
