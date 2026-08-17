"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import useIsDark from "@/hooks/useIsDark";

const stages = [
  "User Program",
  "System Call",
  "Kernel",
  "Process Scheduler",
  "CPU Execution",
];

export default function ProcessLifecycle() {
  const [active, setActive] = useState(0);
  const isDark = useIsDark();

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % stages.length);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {stages.map((stage, i) => (
        <div key={stage} className="flex flex-col items-center">
          <motion.div
            animate={{
              scale: active === i ? 1.08 : 1,
              backgroundColor: active === i ? "#10b981" : isDark ? "#18181b" : "#f4f4f5",
              color: active === i ? "#052e1f" : isDark ? "#a1a1aa" : "#52525b",
              borderColor: active === i ? "#10b981" : isDark ? "#3f3f46" : "#d4d4d8",
            }}
            transition={{ duration: 0.4 }}
            className="w-56 rounded-lg border px-4 py-3 text-center font-mono text-sm font-medium"
          >
            {stage}
          </motion.div>
          {i < stages.length - 1 && (
            <motion.div
              animate={{ opacity: active === i ? 1 : 0.3 }}
              className="my-1 text-emerald-600 dark:text-emerald-400"
            >
              ↓
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
