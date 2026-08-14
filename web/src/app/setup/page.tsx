import PageHeader from "@/components/PageHeader";
import { SetupIcon } from "@/components/Icons";

const steps = [
  {
    title: "1. Start the sandboxed VM",
    body: "A dedicated Colima profile (4 CPU / 8GB RAM / 50GB disk), separate from any other project's VMs.",
    command: "scripts/env.sh up",
  },
  {
    title: "2. Build the toolchain image",
    body: "gcc, make, git, perf, trace-cmd, bpftrace, qemu-system-arm, stress-ng, busybox-static — baked into kernel-sprint-env.",
    command: "scripts/env.sh build",
  },
  {
    title: "3. Clone the kernel source",
    body: "Into a Docker volume, not a host path — macOS's APFS is case-insensitive and silently corrupts the Linux tree's same-directory case-variant files (xt_DSCP.c / xt_dscp.c) if cloned there directly.",
    command:
      "docker run --rm -v kernel-sprint-src:/kernel kernel-sprint-env \\\n  git clone --depth 1 --branch linux-6.6.y \\\n  https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git /kernel",
  },
  {
    title: "4. Build for arm64 (native, no cross-compiler)",
    body: "This VM runs on Apple Silicon — building for arm64 is faster than cross-compiling for x86_64.",
    command: "make ARCH=arm64 defconfig\nmake ARCH=arm64 -j4 Image",
  },
  {
    title: "5. Boot-test under QEMU",
    body: "Software TCG emulation (no nested virtualization inside the VM) — slower than bare metal, but consistent across baseline/optimized comparisons.",
    command:
      "qemu-system-aarch64 -M virt -cpu max -smp 4 -m 1024 \\\n  -kernel arch/arm64/boot/Image -initrd initramfs.cpio.gz \\\n  -append 'console=ttyAMA0 rdinit=/init' -nographic -no-reboot",
  },
  {
    title: "6. Start the orchestrator + dashboard",
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

      <div className="mt-10 space-y-6">
        {steps.map((step) => (
          <div
            key={step.title}
            className="rounded-lg border border-zinc-800 bg-zinc-950 p-5"
          >
            <h2 className="font-medium text-emerald-400">{step.title}</h2>
            {step.body && (
              <p className="mt-2 text-sm text-zinc-400">{step.body}</p>
            )}
            {step.command && (
              <pre className="mt-3 overflow-x-auto rounded bg-black p-3 font-mono text-xs text-zinc-300">
                {step.command}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
