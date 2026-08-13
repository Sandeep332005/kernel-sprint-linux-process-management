const environments = [
  "Ubuntu Linux",
  "Ubuntu Virtual Machine",
  "Docker Container",
  "WSL2",
  "QEMU Kernel Testing",
  "Cloud Linux Instance",
];

const steps = [
  {
    title: "1. Requirements",
    body: "CPU: 4 cores minimum · RAM: 8GB minimum · Storage: 50GB minimum",
  },
  {
    title: "2. Install dependencies",
    command:
      "sudo apt update && sudo apt install -y gcc make git linux-tools-common linux-tools-generic trace-cmd qemu-system-x86 stress-ng",
  },
  {
    title: "3. Verify installation",
    command: "gcc --version && make --version && perf --version",
  },
  {
    title: "4. Kernel download",
    command:
      "git clone https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git\ncd linux && git checkout v6.6 && git checkout -b kernel-sprint",
  },
  {
    title: "5. Build kernel",
    command: "make menuconfig\nmake -j$(nproc)",
  },
  {
    title: "6. Boot testing",
    command: "qemu-system-x86_64 -kernel arch/x86/boot/bzImage ...\nuname -r",
  },
];

export default function SetupPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Environment Setup</h1>
      <p className="mt-2 text-zinc-400">
        Pick an environment, then work through the six steps below.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {environments.map((env) => (
          <span
            key={env}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300"
          >
            {env}
          </span>
        ))}
      </div>

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
