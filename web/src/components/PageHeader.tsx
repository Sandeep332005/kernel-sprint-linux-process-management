import type { ReactNode } from "react";

export default function PageHeader({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        {icon}
      </div>
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <div className="mt-2 space-y-2 text-zinc-600 dark:text-zinc-400">{children}</div>
      </div>
    </div>
  );
}
