import type { ComponentType } from "react";
import { FeaturesIcon, OrchestrateIcon, WorkflowIcon, LabIcon, DocsIcon } from "./Icons";

interface Row {
  icon: ComponentType<{ className?: string }>;
  name: string;
  tags: string[];
  body: string;
}

const ROWS: Row[] = [
  {
    icon: FeaturesIcon,
    name: "Frontend",
    tags: ["Next.js :4477", "12 routes"],
    body: "The dashboard fetches real data over HTTP/WebSocket from the backend — no server-rendered live data, just client calls to :8877.",
  },
  {
    icon: OrchestrateIcon,
    name: "Backend",
    tags: ["FastAPI :8877", "localhost-only"],
    body: "One FastAPI process routes to all six agents; CORS-locked to :4477 and bound to 127.0.0.1 only — never the network.",
  },
  {
    icon: WorkflowIcon,
    name: "Agents",
    tags: ["6 Python modules", "docker_agent.py"],
    body: "Each agent shells out to docker exec / docker run against the sandbox — no Python code touches the kernel directly.",
  },
  {
    icon: LabIcon,
    name: "Sandbox",
    tags: ["kernel-sprint-env", "--privileged container"],
    body: "A single --privileged container runs every real command; debugfs/tracefs are mounted explicitly since Docker doesn't do that by default.",
  },
  {
    icon: DocsIcon,
    name: "Persistence",
    tags: ["Docker volumes", "results/*.md (git)"],
    body: "Docker volumes hold the kernel source and builds; captured results are committed markdown/JSON, not a live database.",
  },
];

export default function SystemBreakdown() {
  return (
    <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-950">
      {ROWS.map((row) => (
        <div key={row.name} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex shrink-0 flex-col items-center gap-2 sm:w-32">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 text-zinc-300">
              <row.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-zinc-100">{row.name}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              {row.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-zinc-700 px-2.5 py-0.5 font-mono text-xs text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm text-zinc-400">{row.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
