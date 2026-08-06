"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

const AGENT_STEPS = [
  "Establishing secure connection to parameters",
  "Ingesting historical upload topography",
  "Cross-referencing global niche velocity",
  "Synthesizing actionable psychological hooks",
  "Compiling final strategy matrix",
] as const;

/* -------------------------------------------------------------------------
   CORE: Agent Status Indicator
------------------------------------------------------------------------- */
function AgentStatusCore({ active }: { active: boolean }) {
  return (
    <div className="relative flex h-7 w-7 items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/30"
        animate={{
          scale: active ? [1, 1.4, 1] : 1,
          opacity: active ? [0.4, 0, 0.4] : 0,
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className={cn(
          "relative h-3.5 w-3.5 rounded-full bg-primary shadow-[0_0_15px_color-mix(in_oklab,var(--color-primary)_60%,transparent)] transition-all duration-700",
          active ? "scale-100" : "scale-75 opacity-50 bg-muted-foreground shadow-none"
        )}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   COMPONENT: Analysis Progress
------------------------------------------------------------------------- */
export function AnalysisProgress({ active }: { active: boolean }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, AGENT_STEPS.length - 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, height: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
          exit={{ opacity: 0, height: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-6 w-full max-w-2xl overflow-hidden"
          role="status"
          aria-live="polite"
        >
          {/* Ambient Hardware-Accelerated Scanning Line */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary/40 blur-md"
            animate={{ left: ["0%", "100%", "0%"] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
          />

          <div className="flex items-center gap-4 border-b border-border/30 pb-6">
            <AgentStatusCore active={active} />
            <div>
              <h3 className="font-display text-[15px] font-semibold text-foreground">
                Agent processing sequence initiated
              </h3>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Please hold while the strategy is compiled.
              </p>
            </div>
          </div>

          <ol className="mt-6 flex flex-col gap-5">
            {AGENT_STEPS.map((step, idx) => {
              const isComplete = idx < stepIndex;
              const isCurrent = idx === stepIndex;

              return (
                <motion.li
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 text-[13px] transition-colors duration-500",
                    isComplete
                      ? "text-muted-foreground"
                      : isCurrent
                      ? "text-foreground font-medium"
                      : "text-muted-foreground/40"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : isCurrent ? (
                    <CircleDashed className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border/40" />
                  )}
                  <span>{step}</span>
                </motion.li>
              );
            })}
          </ol>
        </motion.div>
      )}
    </AnimatePresence>
  );
}