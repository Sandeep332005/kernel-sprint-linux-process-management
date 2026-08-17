"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ProcessLifecycle from "@/components/ProcessLifecycle";
import HeroArt from "@/components/HeroArt";
import {
  OrchestrateIcon,
  WorkflowIcon,
  SetupIcon,
  LabIcon,
  BenchmarkIcon,
  PatchIcon,
  ExperimentsIcon,
  ChaosIcon,
  ResultsIcon,
  DocsIcon,
} from "@/components/Icons";

const explore = [
  { href: "/orchestrate", label: "Orchestrate", icon: OrchestrateIcon, body: "System architecture, honestly diagrammed" },
  { href: "/kernel-workflow", label: "Kernel Workflow", icon: WorkflowIcon, body: "Live-telemetry-paced process lifecycle" },
  { href: "/setup", label: "Setup", icon: SetupIcon, body: "The real steps this project used" },
  { href: "/lab", label: "Lab", icon: LabIcon, body: "Real sandboxed terminal + eBPF monitoring" },
  { href: "/benchmark", label: "Benchmark", icon: BenchmarkIcon, body: "Real 3-run comparison + live pipeline" },
  { href: "/patch", label: "Patch", icon: PatchIcon, body: "Upload a diff, get a real report" },
  { href: "/experiments", label: "Experiments", icon: ExperimentsIcon, body: "Fast parameterized real tests" },
  { href: "/chaos", label: "Chaos", icon: ChaosIcon, body: "Real failure injection, fully sandboxed" },
  { href: "/results", label: "Results", icon: ResultsIcon, body: "The captured before/after report" },
  { href: "/docs", label: "Docs", icon: DocsIcon, body: "EEVDF, eBPF, and what changed" },
];

export default function Home() {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-16 px-6 py-20 text-center">
      <div className="pointer-events-none absolute inset-0 isolate overflow-hidden">
        <HeroArt />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-2xl space-y-4"
      >
        <p className="font-mono text-sm uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Kernel Sprint
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Linux Process Management Challenge
        </h1>
        <p className="mx-auto text-zinc-600 dark:text-zinc-400">
          Analyze the EEVDF scheduler, find a measurable bottleneck, implement
          a kernel-level optimization, and prove the improvement with real
          benchmark evidence — all while staying POSIX compliant.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/lab"
            className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-black transition hover:bg-emerald-400"
          >
            Enter the Lab
          </Link>
          <Link
            href="/orchestrate"
            className="rounded-md border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 transition hover:border-zinc-400 dark:hover:border-zinc-500"
          >
            See the Architecture
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <ProcessLifecycle />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="w-full"
      >
        <p className="mb-5 font-mono text-xs uppercase tracking-wide text-zinc-500">
          Explore the platform
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {explore.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-left transition-colors hover:border-emerald-300 dark:hover:border-emerald-800"
            >
              <item.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <span className="text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {item.label}
              </span>
              <span className="text-center text-xs text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
                {item.body}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
