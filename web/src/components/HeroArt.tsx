"use client";

import { motion } from "framer-motion";

const nodes = [
  { x: 320, y: 60 }, { x: 420, y: 140 }, { x: 480, y: 260 },
  { x: 400, y: 360 }, { x: 280, y: 400 }, { x: 180, y: 320 },
  { x: 160, y: 200 }, { x: 240, y: 100 }, { x: 320, y: 220 },
];

const edges: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  [1, 8], [3, 8], [5, 8], [7, 8],
];

export default function HeroArt() {
  return (
    <svg
      viewBox="0 0 560 460"
      className="pointer-events-none absolute -right-16 top-1/2 hidden h-[110%] w-auto -translate-y-1/2 opacity-[0.35] sm:block lg:opacity-50"
      aria-hidden="true"
    >
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="currentColor"
          strokeWidth={1}
          className="text-emerald-800"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: i * 0.05, ease: "easeOut" }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={i === 8 ? 6 : 4}
          className="text-emerald-500"
          fill="currentColor"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.4, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}
