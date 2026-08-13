"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/kernel-workflow", label: "Kernel Workflow" },
  { href: "/setup", label: "Setup" },
  { href: "/lab", label: "Lab" },
  { href: "/benchmark", label: "Benchmark" },
  { href: "/patch", label: "Patch" },
  { href: "/results", label: "Results" },
  { href: "/docs", label: "Docs" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-3 text-sm">
        <span className="mr-4 shrink-0 font-mono font-semibold text-emerald-400">
          kernel-sprint
        </span>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded px-3 py-1.5 transition-colors ${
                active
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
