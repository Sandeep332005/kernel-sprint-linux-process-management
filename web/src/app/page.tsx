"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ProcessLifecycle from "@/components/ProcessLifecycle";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-12 px-6 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <p className="font-mono text-sm uppercase tracking-widest text-emerald-400">
          Kernel Sprint
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Linux Process Management Challenge
        </h1>
        <p className="mx-auto max-w-2xl text-zinc-400">
          Analyze the Completely Fair Scheduler, find a measurable
          bottleneck, implement a kernel-level optimization, and prove the
          improvement with benchmark evidence — all while staying POSIX
          compliant.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/lab"
            className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-black transition hover:bg-emerald-400"
          >
            Enter the Lab
          </Link>
          <Link
            href="/kernel-workflow"
            className="rounded-md border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
          >
            See the Workflow
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
    </div>
  );
}
