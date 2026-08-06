"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ChannelInputForm } from "@/components/dashboard/channel-input-form";
import { AnalysisProgress } from "@/components/dashboard/analysis-progress";
import { useRunAnalysis } from "@/lib/hooks/use-run-analysis";

/* -------------------------------------------------------------------------
   AMBIENT FIELD
   Layered background: precision grid + single cursor-reactive spotlight +
   two slow-drifting light sources far behind content. No blobs, no noise
   spam — depth comes from restraint, not decoration density.
------------------------------------------------------------------------- */
function AmbientField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 0.4 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 0.4 });
  const [hasPointer, setHasPointer] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
      if (!hasPointer) setHasPointer(true);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY, hasPointer]);

  const spotlightBackground = useTransform(
    [smoothX, smoothY],
    ([x, y]) =>
      `radial-gradient(680px circle at ${x}px ${y}px, color-mix(in oklab, var(--color-primary) 8%, transparent), transparent 65%)`
  );

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Precision grid — barely-there structural layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.04]" />

      {/* Radial mask so grid fades at the edges, focusing attention centrally */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,transparent_20%,var(--color-background)_100%)]" />

      {/* Two slow ambient light sources — far behind, extremely subtle */}
      <motion.div
        className="absolute left-[8%] top-[-8%] h-[34rem] w-[34rem] rounded-full bg-primary/[0.05] blur-[160px]"
        animate={{ x: [0, 40, 0], y: [0, 26, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[4%] top-[18%] h-[28rem] w-[28rem] rounded-full bg-primary/[0.035] blur-[160px]"
        animate={{ x: [0, -32, 0], y: [0, 34, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* Cursor spotlight — the "alive" layer, only active once pointer moves */}
      {hasPointer && (
        <motion.div
          className="absolute inset-0 opacity-0 transition-opacity duration-700"
          style={{ background: spotlightBackground, opacity: hasPointer ? 1 : 0 }}
        />
      )}

      {/* Fine grain to kill flatness on the dark surface */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.025] mix-blend-overlay">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------
   STATUS PILL — live "agent ready" indicator with a genuinely breathing dot
------------------------------------------------------------------------- */
function StatusPill() {
  return (
    <motion.div
      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 backdrop-blur-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full bg-primary/50"
          animate={{ scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Agent ready
      </span>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------
   TEXT REVEAL — headline masks in word by word, like light hitting glass
------------------------------------------------------------------------- */
function RevealHeadline({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h1 className="mt-4 flex flex-wrap font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
      {words.map((word, i) => (
        <span key={i} className="mr-[0.28em] overflow-hidden pb-1">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              duration: 0.7,
              delay: 0.15 + i * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { mutate, isPending } = useRunAnalysis();

  const handleSubmit = (channelUrl: string) => {
    mutate(channelUrl, {
      onSuccess: (data) => {
        router.push(`/analysis/${data.analysis_uuid}`);
      },
    });
  };

  return (
    <div className="max-w-3xl">
      <AmbientField />

      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <StatusPill />

        <RevealHeadline text="New analysis" />

        <motion.p
          className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          Paste any YouTube channel URL. We&apos;ll study its content, cross-check
          trends, and generate ranked video ideas — ready before your coffee
          gets cold.
        </motion.p>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChannelInputForm onSubmit={handleSubmit} isPending={isPending} />
        </motion.div>

        <AnalysisProgress active={isPending} />
      </motion.div>
    </div>
  );
}