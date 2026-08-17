"use client";

import { motion } from "framer-motion";

interface Leaf {
  label: string;
}

interface Branch {
  label: string;
  color: string;
  leaves: [Leaf, Leaf];
}

const ROOT = "kernel-sprint";

const BRANCHES: Branch[] = [
  {
    label: "Frontend",
    color: "#b45309",
    leaves: [{ label: "Next.js :4477" }, { label: "12 routes" }],
  },
  {
    label: "Backend",
    color: "#4338ca",
    leaves: [{ label: "FastAPI :8877" }, { label: "localhost-only" }],
  },
  {
    label: "Agents",
    color: "#15803d",
    leaves: [{ label: "6 Python modules" }, { label: "docker_agent.py" }],
  },
  {
    label: "Sandbox",
    color: "#1d4ed8",
    leaves: [{ label: "kernel-sprint-env" }, { label: "--privileged container" }],
  },
  {
    label: "Persistence",
    color: "#0f766e",
    leaves: [{ label: "Docker volumes" }, { label: "results/*.md (git)" }],
  },
];

const WIDTH = 900;
const HEIGHT = 620;
const ROOT_X = 60;
const ROOT_Y = HEIGHT / 2;
const BRANCH_X = 430;
const LEAF_X = 760;
const ROW_H = HEIGHT / BRANCHES.length;

function branchY(i: number) {
  return ROW_H * i + ROW_H / 2;
}

function Node({
  x,
  y,
  width,
  height,
  color,
  filled,
  children,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  filled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <foreignObject x={x - width / 2} y={y - height / 2} width={width} height={height}>
      <div
        className="flex h-full w-full items-center justify-center rounded-lg border px-2 text-center font-mono text-[11px] font-medium"
        style={{
          borderColor: color,
          backgroundColor: filled ? color : `${color}22`,
          color: filled ? "#0a0a0a" : color,
        }}
      >
        {children}
      </div>
    </foreignObject>
  );
}

export default function SystemTree() {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full text-zinc-400 dark:text-zinc-700"
      role="img"
      aria-label="kernel-sprint system architecture tree"
    >
      {BRANCHES.map((b, i) => {
        const by = branchY(i);
        return (
          <motion.path
            key={`root-${b.label}`}
            d={`M ${ROOT_X + 70} ${ROOT_Y} C ${(ROOT_X + BRANCH_X) / 2} ${ROOT_Y}, ${(ROOT_X + BRANCH_X) / 2} ${by}, ${BRANCH_X - 75} ${by}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: i * 0.08 }}
          />
        );
      })}

      {BRANCHES.map((b, i) => {
        const by = branchY(i);
        return b.leaves.map((leaf, li) => {
          const ly = by + (li === 0 ? -24 : 24);
          return (
            <motion.path
              key={`${b.label}-leaf-${li}`}
              d={`M ${BRANCH_X + 75} ${by} L ${LEAF_X - 65} ${ly}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.08 + li * 0.05 }}
            />
          );
        });
      })}

      <Node x={ROOT_X + 5} y={ROOT_Y} width={150} height={42} color="#3f3f46">
        {ROOT}
      </Node>

      {BRANCHES.map((b, i) => (
        <Node key={b.label} x={BRANCH_X} y={branchY(i)} width={150} height={40} color={b.color} filled>
          {b.label}
        </Node>
      ))}

      {BRANCHES.map((b, i) =>
        b.leaves.map((leaf, li) => (
          <Node
            key={`${b.label}-${leaf.label}`}
            x={LEAF_X}
            y={branchY(i) + (li === 0 ? -24 : 24)}
            width={170}
            height={30}
            color={b.color}
          >
            {leaf.label}
          </Node>
        ))
      )}
    </svg>
  );
}
