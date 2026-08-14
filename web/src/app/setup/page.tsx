import PageHeader from "@/components/PageHeader";
import {
  SetupIcon,
  LabIcon,
  PatchIcon,
  WorkflowIcon,
  ExperimentsIcon,
  OrchestrateIcon,
} from "@/components/Icons";

const steps = [
  {
    title: "Start the sandboxed VM",
    icon: SetupIcon,
    body: "A dedicated Colima profile (4 CPU / 8GB RAM / 50GB disk), separate from any other project's VMs.",
    command: "scripts/env.sh up",
  },
  {
    title: "Build the toolchain image",
    icon: LabIcon,
    body: "gcc, make, git, perf, trace-cmd, bpftrace, qemu-system-arm, stress-ng, busybox-static — baked into kernel-sprint-env.",
    command: "scripts/env.sh build",
  },
  {
    title: "Clone the kernel source",
    icon: PatchIcon,
    body: "Into a Docker volume, not a host path — macOS's APFS is case-insensitive and silently corrupts the Linux tree's same-directory case-variant files (xt_DSCP.c / xt_dscp.c) if cloned there directly.",
    command:
      "docker run --rm -v kernel-sprint-src:/kernel kernel-sprint-env \\\n  git clone --depth 1 --branch linux-6.6.y \\\n  https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git /kernel",
  },
  {
    title: "Build for arm64 (native, no cross-compiler)",
    icon: WorkflowIcon,
    body: "This VM runs on Apple Silicon — building for arm64 is faster than cross-compiling for x86_64.",
    command: "make ARCH=arm64 defconfig\nmake ARCH=arm64 -j4 Image",
  },
  {
    title: "Boot-test under QEMU",
    icon: ExperimentsIcon,
    body: "Software TCG emulation (no nested virtualization inside the VM) — slower than bare metal, but consistent across baseline/optimized comparisons.",
    command:
      "qemu-system-aarch64 -M virt -cpu max -smp 4 -m 1024 \\\n  -kernel arch/arm64/boot/Image -initrd initramfs.cpio.gz \\\n  -append 'console=ttyAMA0 rdinit=/init' -nographic -no-reboot",
  },
  {
    title: "Start the orchestrator + dashboard",
    icon: OrchestrateIcon,
    body: "The backend talks to the VM's Docker socket directly; the frontend talks to the backend.",
    command: "cd backend && source .venv/bin/activate && python main.py   # :8877\ncd web && npm run dev                                        # :4477",
  },
];

export default function SetupPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <PageHeader icon={<SetupIcon className="h-5 w-5" />} title="Environment Setup">
        <p>
          The actual steps this project used — not a generic example. See{" "}
          <code className="text-zinc-300">documentation/environment-setup.md</code>{" "}
          for the full incident log (disk-full recovery, case-sensitivity fix,
          the perf/kernel-version mismatch) behind each of these.
        </p>
      </PageHeader>

      <div className="mt-10">
        {steps.map((step, i) => (
          <div key={step.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-800 bg-emerald-500/10 text-emerald-400">
                <step.icon className="h-5 w-5" />
              </div>
              {i < steps.length - 1 && (
                <div className="my-1 w-px flex-1 bg-zinc-800" />
              )}
            </div>
            <div className="pb-8">
              <p className="font-mono text-xs text-zinc-600">Step {i + 1}</p>
              <h2 className="font-medium text-zinc-100">{step.title}</h2>
              <p className="mt-1.5 text-sm text-zinc-400">{step.body}</p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
                {step.command}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
