"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  FeaturesIcon,
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
} from "./Icons";
import ThemeToggle from "./ThemeToggle";

const groups: { label: string; links: { href: string; label: string; icon: ReactNode }[] }[] = [
  {
    label: "Learn",
    links: [
      { href: "/", label: "Home", icon: <HomeIcon className="h-4 w-4" /> },
      { href: "/features", label: "Features", icon: <FeaturesIcon className="h-4 w-4" /> },
      { href: "/orchestrate", label: "Orchestrate", icon: <OrchestrateIcon className="h-4 w-4" /> },
      { href: "/kernel-workflow", label: "Workflow", icon: <WorkflowIcon className="h-4 w-4" /> },
      { href: "/setup", label: "Setup", icon: <SetupIcon className="h-4 w-4" /> },
      { href: "/docs", label: "Docs", icon: <DocsIcon className="h-4 w-4" /> },
    ],
  },
  {
    label: "Do",
    links: [
      { href: "/lab", label: "Lab", icon: <LabIcon className="h-4 w-4" /> },
      { href: "/benchmark", label: "Benchmark", icon: <BenchmarkIcon className="h-4 w-4" /> },
      { href: "/patch", label: "Patch", icon: <PatchIcon className="h-4 w-4" /> },
      { href: "/experiments", label: "Experiments", icon: <ExperimentsIcon className="h-4 w-4" /> },
      { href: "/chaos", label: "Chaos", icon: <ChaosIcon className="h-4 w-4" /> },
    ],
  },
  {
    label: "",
    links: [{ href: "/results", label: "Results", icon: <ResultsIcon className="h-4 w-4" /> }],
  },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 text-sm">
        <span className="shrink-0 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          kernel-sprint
        </span>
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-4 overflow-x-auto">
            {groups.map((group) => (
              <div key={group.label || "ungrouped"} className="flex shrink-0 items-center gap-1">
                {group.label && (
                  <span className="mr-1 hidden font-mono text-[10px] uppercase tracking-wider text-zinc-500 sm:inline dark:text-zinc-600">
                    {group.label}
                  </span>
                )}
                {group.links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 transition-colors ${
                        active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      }`}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  );
                })}
                <span className="mx-1 h-4 w-px bg-zinc-300 last:hidden dark:bg-zinc-800" />
              </div>
            ))}
          </div>
          {/* Fade hint at the scrollable edge -- without it, a link clipped
              mid-word by overflow-x-auto (e.g. "Experiments" -> "E") reads
              as a rendering bug rather than "scroll for more". */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-black"
            aria-hidden="true"
          />
        </div>
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
