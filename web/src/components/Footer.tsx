import Link from "next/link";
import { OrchestrateIcon } from "./Icons";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-zinc-500">
          <OrchestrateIcon className="h-4 w-4 text-emerald-500" />
          <span className="font-mono">kernel-sprint</span>
          <span className="text-zinc-700">·</span>
          <span>every number on this site was measured, not written</span>
        </div>
        <Link
          href="https://github.com/Sandeep332005/kernel-sprint-linux-process-management"
          className="font-mono text-xs text-zinc-500 transition-colors hover:text-emerald-400"
        >
          source →
        </Link>
      </div>
    </footer>
  );
}
