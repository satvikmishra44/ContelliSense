"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Resolving channel", detail: "Verifying handle and fetching metadata" },
  { label: "Fetching video history", detail: "Pulling upload timeline and stats" },
  { label: "Classifying content niche", detail: "Mapping topics against category graph" },
  { label: "Collecting trend signals", detail: "Cross-referencing rising search demand" },
  { label: "Building AI context", detail: "Structuring signals for reasoning pass" },
  { label: "Generating recommendations", detail: "Ranking ideas by predicted upside" },
] as const;

const STEP_DURATION_MS = 3500;

/* -------------------------------------------------------------------------
   BREATHING CORE
   A small pulsing node that represents the "agent" itself — this is the
   emotional anchor of the loading experience. It breathes at rest and
   flares briefly each time a step completes.
------------------------------------------------------------------------- */
function BreathingCore({ pulseKey }: { pulseKey: number }) {
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20"
        animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.15, 0.5] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <AnimatePresence>
        <motion.div
          key={pulseKey}
          className="absolute inset-0 rounded-full border border-primary/50"
          initial={{ scale: 0.6, opacity: 0.9 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </AnimatePresence>
      <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-[0_0_20px_-2px_var(--color-primary)]">
        <motion.div
          className="h-2 w-2 rounded-full bg-white/90"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   ELAPSED TIMER — mono numeric readout, ticks in real time
------------------------------------------------------------------------- */
function ElapsedTimer({ active }: { active: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [active]);

  const seconds = elapsed.toFixed(1);

  return (
    <span className="font-mono text-[12px] tabular-nums text-muted-foreground/70">
      {seconds}s
    </span>
  );
}

/* -------------------------------------------------------------------------
   STEP RAIL PROGRESS
   A vertical line that fills smoothly (not in discrete jumps) between
   steps, giving continuous motion instead of a staircase feeling.
------------------------------------------------------------------------- */
function ConnectingRail({ progress }: { progress: number }) {
  return (
    <div className="absolute left-[21px] top-11 h-[calc(100%-2.75rem)] w-px bg-border/60">
      <motion.div
        className="absolute left-0 top-0 w-px bg-gradient-to-b from-primary to-primary/40"
        style={{ height: `${progress * 100}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export function AnalysisProgress({ active }: { active: boolean }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          setPulseKey((k) => k + 1);
          return prev + 1;
        }
        return prev;
      });
    }, STEP_DURATION_MS);
    return () => clearInterval(interval);
  }, [active]);

  const railProgress = stepIndex / (STEPS.length - 1);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -12 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -12 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 overflow-hidden"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm">
            {/* Ambient scan-line sweep across the card while active */}
            <motion.div
              aria-hidden
              className="absolute inset-0 opacity-[0.04]"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, var(--color-primary) 50%, transparent 60%)",
              }}
              animate={{ x: ["-120%", "120%"] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative flex items-center justify-between border-b border-border/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <BreathingCore pulseKey={pulseKey} />
                <div>
                  <h3 className="font-display text-[15px] font-medium text-foreground">
                    Running full channel analysis
                  </h3>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {STEPS[stepIndex].detail}
                  </p>
                </div>
              </div>
              <ElapsedTimer active={active} />
            </div>

            <div className="relative px-6 py-5">
              <ConnectingRail progress={railProgress} />

              <ol className="space-y-4" role="list">
                {STEPS.map((step, idx) => {
                  const done = idx < stepIndex;
                  const current = idx === stepIndex;

                  return (
                    <motion.li
                      key={step.label}
                      className="relative flex items-center gap-3"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.04 }}
                    >
                      <span
                        className={cn(
                          "relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border text-[11px] font-medium transition-all duration-500",
                          done &&
                            "border-primary bg-primary text-primary-foreground shadow-[0_0_12px_-2px_var(--color-primary)]",
                          current &&
                            "border-primary/60 text-primary",
                          !done && !current && "border-border/60 text-muted-foreground/50"
                        )}
                      >
                        <AnimatePresence mode="wait">
                          {done ? (
                            <motion.span
                              key="done"
                              initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
                              animate={{ scale: 1, opacity: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 22 }}
                            >
                              <Check className="h-3 w-3" />
                            </motion.span>
                          ) : current ? (
                            <motion.span
                              key="current"
                              className="relative flex h-full w-full items-center justify-center"
                            >
                              <motion.span
                                className="absolute h-full w-full rounded-full border border-primary/40"
                                animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                              />
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            </motion.span>
                          ) : (
                            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              {idx + 1}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>

                      <span
                        className={cn(
                          "text-[13.5px] transition-colors duration-500",
                          done ? "text-foreground/70" : current ? "text-foreground" : "text-muted-foreground/50"
                        )}
                      >
                        {step.label}
                      </span>

                      {current && (
                        <motion.span
                          className="ml-auto flex gap-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="h-1 w-1 rounded-full bg-primary/60"
                              animate={{ opacity: [0.2, 1, 0.2] }}
                              transition={{
                                duration: 1.1,
                                repeat: Infinity,
                                delay: i * 0.18,
                                ease: "easeInOut",
                              }}
                            />
                          ))}
                        </motion.span>
                      )}
                    </motion.li>
                  );
                })}
              </ol>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}