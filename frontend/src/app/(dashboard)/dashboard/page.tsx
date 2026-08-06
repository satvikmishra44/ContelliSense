"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ChannelInputForm } from "@/components/dashboard/channel-input-form";
import { AnalysisProgress } from "@/components/dashboard/analysis-progress";
import { useRunAnalysis } from "@/lib/hooks/use-run-analysis";

/* -------------------------------------------------------------------------
   FIELD — canvas-rendered dot grid, individually reacting to cursor
   proximity. Pure canvas, no DOM nodes per dot, so this stays 60fps even
   with hundreds of points. This is the "alive background" layer — it
   should feel like a sensor field, not decoration.
------------------------------------------------------------------------- */
function Field() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const GAP = 34;
    let dots: { x: number; y: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      dots = [];
      for (let x = GAP / 2; x < canvas.offsetWidth; x += GAP) {
        for (let y = GAP / 2; y < canvas.offsetHeight; y += GAP) {
          dots.push({ x, y });
        }
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", handleMove);

    const RADIUS = 160;

    const render = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      for (const d of dots) {
        const dx = d.x - mouse.current.x;
        const dy = d.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - dist / RADIUS);
        const size = 1 + proximity * 2.2;
        const alpha = 0.05 + proximity * 0.5;

        ctx.beginPath();
        ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `color-mix(in oklab, var(--color-primary) ${Math.round(
          alpha * 100
        )}%, transparent)`;
        ctx.fill();
      }
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 -z-10 h-full w-full bg-background"
    />
  );
}

/* -------------------------------------------------------------------------
   AMBIENT LIGHT — two slow, oversized radial glows drifting behind the
   field. Spring-driven scale breathing, not looping opacity — springs
   read as organic, opacity loops read as "gif".
------------------------------------------------------------------------- */
function AmbientLight() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute left-[-15%] top-[-20%] h-[42rem] w-[42rem] rounded-full bg-primary/[0.07] blur-[160px]"
        animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-10%] top-[5%] h-[34rem] w-[34rem] rounded-full bg-primary/[0.045] blur-[160px]"
        animate={{ x: [0, -40, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   MAGNETIC CURSOR
   Replaces the OS cursor with a small ring that trails via spring physics
   and swells when hovering any [data-magnetic] element. This is the
   single highest-leverage "who built this" moment on the page.
------------------------------------------------------------------------- */
function MagneticCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
      const target = e.target as HTMLElement;
      setActive(!!target.closest("[data-magnetic]"));
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y, visible]);

  if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
    return null;
  }

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[999] hidden rounded-full border border-primary/70 mix-blend-difference md:block"
      style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
      animate={{
        width: active ? 44 : 16,
        height: active ? 44 : 16,
        opacity: visible ? 1 : 0,
        borderWidth: active ? 1.5 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    />
  );
}

/* -------------------------------------------------------------------------
   STATUS BEACON
------------------------------------------------------------------------- */
function StatusBeacon() {
  return (
    <motion.div
      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 backdrop-blur-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.05 }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full bg-primary/50"
          animate={{ scale: [1, 2.6, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
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
   HEADLINE — per-character mask reveal. Spring-driven, staggered by index.
   No shared `variants` object (that's what broke your TS build) — every
   animation prop is inlined so TS infers literal types correctly.
------------------------------------------------------------------------- */
function Headline({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h1 className="mt-4 flex flex-wrap font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
      {words.map((word, i) => (
        <span key={word + i} className="mr-[0.28em] overflow-hidden pb-1">
          <motion.span
            className="inline-block"
            initial={{ y: "115%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 24,
              delay: 0.15 + i * 0.06,
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
      <Field />
      <AmbientLight />
      <MagneticCursor />

      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
      >
        <StatusBeacon />

        <Headline text="New analysis" />

        <motion.p
          className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.32 }}
        >
          Paste any YouTube channel URL. We&apos;ll study its content, cross-check
          trends, and generate ranked video ideas — ready before your coffee gets
          cold.
        </motion.p>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.42 }}
        >
          <ChannelInputForm onSubmit={handleSubmit} isPending={isPending} />
        </motion.div>

        <AnalysisProgress active={isPending} />
      </motion.div>
    </div>
  );
}