"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  "Resolving channel",
  "Fetching video history",
  "Classifying content niche",
  "Collecting trend signals",
  "Building AI context",
  "Generating recommendations",
];

export function AnalysisProgress({ active }: { active: boolean }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 3500);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className="rounded-xl border bg-card p-6 mt-6">
      <h3 className="font-display text-base font-medium mb-4">
        Running full channel analysis
      </h3>
      <ol className="space-y-3" role="list">
        {STEPS.map((step, idx) => {
          const done = idx < stepIndex;
          const current = idx === stepIndex;
          return (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  done && "bg-primary border-primary text-primary-foreground",
                  current && "border-primary text-primary",
                  !done && !current && "text-muted-foreground"
                )}
              >
                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.span
                      key="done"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.span>
                  ) : current ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </AnimatePresence>
              </span>
              <span
                className={cn(
                  done || current ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}