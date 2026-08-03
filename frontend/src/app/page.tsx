// import Link from "next/link";
// import { ArrowRight, Sparkles, TrendingUp, FileSpreadsheet } from "lucide-react";
// import { Button } from "@/components/ui/button";

// export default function LandingPage() {
//   return (
//     <main className="min-h-screen bg-background">
//       <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
//         <div className="flex items-center gap-2 font-display text-lg font-semibold">
//           <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-label="Contellisense logo">
//             <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" stroke="currentColor" strokeWidth="1.6" className="text-primary" />
//             <circle cx="12" cy="12" r="3" fill="currentColor" className="text-primary" />
//           </svg>
//           Contellisense
//         </div>
//         <Link href="/dashboard">
//           <Button variant="default" size="sm">
//             Launch app <ArrowRight className="ml-1 h-4 w-4" />
//           </Button>
//         </Link>
//       </nav>

//       <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
//         <h1 className="text-2xl md:text-3xl font-display font-semibold leading-tight tracking-tight">
//           Know exactly what your next YouTube video should be.
//         </h1>
//         <p className="mt-5 text-base text-muted-foreground max-w-2xl mx-auto">
//           Contellisense studies your channel's real upload patterns, cross-references
//           live search trends in your niche, and hands you ranked, ready-to-shoot video
//           ideas — with hooks, thumbnails, and virality scores included.
//         </p>
//         <div className="mt-8 flex items-center justify-center gap-3">
//           <Link href="/dashboard">
//             <Button size="lg">Analyze your channel</Button>
//           </Link>
//           <Button size="lg" variant="outline">
//             See how it works
//           </Button>
//         </div>
//       </section>

//       <section className="max-w-5xl mx-auto px-6 pb-24 grid gap-4 md:grid-cols-3">
//         <div className="rounded-xl border bg-card p-6 shadow-sm">
//           <Sparkles className="h-5 w-5 text-primary" />
//           <h3 className="mt-4 font-display text-lg font-medium">Niche-aware AI</h3>
//           <p className="mt-2 text-sm text-muted-foreground">
//             Learns your exact content style from your last 100 uploads before
//             suggesting a single idea.
//           </p>
//         </div>
//         <div className="rounded-xl border bg-card p-6 shadow-sm md:mt-6">
//           <TrendingUp className="h-5 w-5 text-primary" />
//           <h3 className="mt-4 font-display text-lg font-medium">Live trend signals</h3>
//           <p className="mt-2 text-sm text-muted-foreground">
//             Multi-keyword Google Trends momentum and velocity, mapped directly to
//             your niche vocabulary.
//           </p>
//         </div>
//         <div className="rounded-xl border bg-card p-6 shadow-sm">
//           <FileSpreadsheet className="h-5 w-5 text-primary" />
//           <h3 className="mt-4 font-display text-lg font-medium">Exportable reports</h3>
//           <p className="mt-2 text-sm text-muted-foreground">
//             One-click Excel export with channel stats, video analytics, and full
//             recommendation breakdowns.
//           </p>
//         </div>
//       </section>
//     </main>
//   );
// }

"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useAnimationFrame,
  AnimatePresence,
} from "framer-motion";
import {
  Sparkles,
  Brain,
  TrendingUp,
  FileSpreadsheet,
  Database,
  Zap,
  ArrowRight, 
  PlaySquare,
  BarChart3,
  Layers,
  Radio,
  Menu,
  X,
  Check,
} from "lucide-react";

/* -------------------------------------------------------------------------
   SMOOTH SCROLL (Lenis)
------------------------------------------------------------------------- */
function useLenis() {
  useEffect(() => {
    let lenis: any;
    let rafId: number;
    (async () => {
      const Lenis = (await import("lenis")).default;
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    })();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
    };
  }, []);
}

/* -------------------------------------------------------------------------
   NOISE -> SIGNAL CANVAS (particles converge into a clean sine wave
   as the user scrolls through the hero)
------------------------------------------------------------------------- */
function NoiseToSignalCanvas({ progress }: { progress: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<
    { x: number; y: number; baseX: number; baseY: number; r: number; hue: number }[]
  >([]);
  const progressVal = useRef(0);

  useEffect(() => {
    const unsub = progress.on("change", (v: number) => (progressVal.current = v));
    return () => unsub();
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;
    const COUNT = 220;

    particles.current = Array.from({ length: COUNT }).map((_, i) => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      baseX: (i / COUNT) * W(),
      baseY: H() / 2,
      r: Math.random() * 1.8 + 0.6,
      hue: 260 + Math.random() * 60,
    }));

    let raf: number;
    let t = 0;
    const render = () => {
      t += 0.012;
      ctx.clearRect(0, 0, W(), H());
      const p = progressVal.current;

      particles.current.forEach((pt, i) => {
        const wave =
          Math.sin(pt.baseX * 0.02 + t) * 40 * (1 - p * 0.3) +
          Math.sin(pt.baseX * 0.008 + t * 0.6) * 18;
        const targetX = pt.baseX;
        const targetY = H() / 2 + wave;

        pt.x += (targetX - pt.x) * (0.02 + p * 0.06);
        pt.y += (targetY - pt.y) * (0.02 + p * 0.06);

        const jitter = (1 - p) * 60;
        const jx = pt.x + Math.sin(t * 2 + i) * jitter * 0.15;
        const jy = pt.y + Math.cos(t * 2 + i) * jitter * 0.15;

        ctx.beginPath();
        ctx.arc(jx, jy, pt.r + p * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${pt.hue}, 90%, ${60 + p * 15}%, ${0.35 + p * 0.5})`;
        ctx.fill();

        if (i > 0 && p > 0.35) {
          const prev = particles.current[i - 1];
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.strokeStyle = `hsla(265, 90%, 70%, ${(p - 0.35) * 0.9})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

/* -------------------------------------------------------------------------
   REUSABLE: Reveal on scroll
------------------------------------------------------------------------- */
function Reveal({
  children,
  delay = 0,
  y = 40,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------
   ANIMATED COUNTER
------------------------------------------------------------------------- */
function Counter({ to, suffix = "", label }: { to: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const duration = 1600;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.floor(eased * to));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, started]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-white to-violet-300 bg-clip-text text-transparent tabular-nums">
        {val.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-2 text-sm md:text-base text-white/50">{label}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   PIPELINE SVG — draws itself as you scroll through the section
------------------------------------------------------------------------- */
function PipelineDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });
  const pathLength = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  const nodes = [
    { icon: PlaySquare, label: "Raw Channel Data", x: "8%" },
    { icon: Layers, label: "Sentence Embeddings", x: "32%" },
    { icon: Brain, label: "AI Reasoning", x: "56%" },
    { icon: TrendingUp, label: "Trend Signals", x: "80%" },
  ];

  return (
    <div ref={ref} className="relative w-full py-24">
      <svg
        className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-24 hidden md:block"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M 40 50 C 250 -20, 350 120, 500 50 S 750 -20, 960 50"
          fill="none"
          stroke="url(#grad)"
          strokeWidth="2.5"
          style={{ pathLength }}
        />
        <defs>
          <linearGradient id="grad" x1="0" x2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
        {nodes.map((n, i) => (
          <motion.div
            key={n.label}
            initial={{ opacity: 0, scale: 0.6, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_-10px_rgba(167,139,250,0.5)]">
              <n.icon className="h-7 w-7 text-violet-300" strokeWidth={1.5} />
            </div>
            <span className="text-xs md:text-sm text-white/60 max-w-[110px]">{n.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   TILT CARD (feature card with mouse-based 3D tilt)
------------------------------------------------------------------------- */
function TiltCard({
  icon: Icon,
  title,
  desc,
  delay = 0,
}: {
  icon: any;
  title: string;
  desc: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const sRotateX = useSpring(rotateX, { stiffness: 150, damping: 15 });
  const sRotateY = useSpring(rotateY, { stiffness: 150, damping: 15 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 14);
    rotateX.set(-py * 14);
  };
  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        style={{ rotateX: sRotateX, rotateY: sRotateY, transformStyle: "preserve-3d" }}
        className="group relative h-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 backdrop-blur-xl overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
          <Icon className="h-6 w-6 text-violet-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/55 leading-relaxed">{desc}</p>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------
   MARQUEE
------------------------------------------------------------------------- */
function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <div className="relative overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex gap-6 w-max"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {[...items, ...items].map((t, i) => (
          <div
            key={i}
            className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/60"
          >
            {t}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   NAVBAR
------------------------------------------------------------------------- */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Problem", "Solution", "Features", "How it works", "Pricing"];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled ? "bg-black/60 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
            <Radio className="h-4 w-4 text-black" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">ContelliSense</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {l}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button className="text-sm text-white/70 hover:text-white transition-colors">Sign in</button>
          <button className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors">
            Get started
          </button>
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-black/90 backdrop-blur-xl border-b border-white/10"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {links.map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().replace(/\s/g, "-")}`}
                  onClick={() => setOpen(false)}
                  className="text-white/70 text-sm"
                >
                  {l}
                </a>
              ))}
              <button className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black">
                Get started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* -------------------------------------------------------------------------
   HERO
------------------------------------------------------------------------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const canvasOpacity = useTransform(scrollYProgress, [0, 1], [0.5, 1]);

  return (
    <div ref={ref} className="relative h-[130vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center">
        <motion.div style={{ opacity: canvasOpacity }} className="absolute inset-0">
          <NoiseToSignalCanvas progress={scrollYProgress} />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />

        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="relative z-10 flex flex-col items-center text-center px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60 backdrop-blur-xl"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            AI-native content intelligence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white max-w-5xl leading-[1.05]"
          >
            Turn terabytes of{" "}
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              noise
            </span>{" "}
            into{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              signal
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.8 }}
            className="mt-6 max-w-2xl text-base sm:text-lg text-white/55"
          >
            Every day, creators drown in millions of videos, trends and comments.
            We embed it, reason over it with AI, and hand you the three things
            that actually move your channel — instantly, in one report.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <button className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-105">
              Analyze my channel
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-white/80 hover:bg-white/5 transition-colors">
              Watch demo
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-white/40"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="h-8 w-5 rounded-full border border-white/20 flex items-start justify-center p-1"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   PROBLEM SECTION — chaotic floating stat chips + word reveal
------------------------------------------------------------------------- */
function Problem() {
  const words =
    "Every minute, hundreds of hours of video, millions of comments, and endless trend data get published. Almost none of it is usable.".split(
      " "
    );
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.4"] });

  return (
    <section id="problem" ref={ref} className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-violet-400/30"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 4 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <span className="text-xs uppercase tracking-widest text-violet-300/80">The Problem</span>
        </Reveal>

        <p className="mt-6 text-2xl sm:text-4xl md:text-5xl font-semibold leading-tight text-white/90">
          {words.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.08 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, duration: 0.4 }}
              className="inline-block mr-[0.3em]"
            >
              {w}
            </motion.span>
          ))}
        </p>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-10">
          <Counter to={500} suffix="+ hrs" label="video uploaded every minute" />
          <Counter to={94} suffix="%" label="of trend data creators never see" />
          <Counter to={12} suffix=" min" label="avg. time wasted per report today" />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   SOLUTION SECTION
------------------------------------------------------------------------- */
function Solution() {
  return (
    <section id="solution" className="relative py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <Reveal>
            <span className="text-xs uppercase tracking-widest text-violet-300/80">The Solution</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight">
              One pipeline. From raw chaos to a clear next move.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-5 max-w-xl mx-auto text-white/55">
              We embed your content and market data into meaning, reason over it with
              AI, and package it into a report you can act on today.
            </p>
          </Reveal>
        </div>

        <PipelineDiagram />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   FEATURES
------------------------------------------------------------------------- */
function Features() {
  const features = [
    {
      icon: Layers,
      title: "Semantic Embeddings",
      desc: "Every title, transcript and comment is embedded into vector space so we can find patterns humans miss.",
    },
    {
      icon: Brain,
      title: "AI Reasoning Layer",
      desc: "A reasoning model turns raw signals into plain-language recommendations tailored to your niche.",
    },
    {
      icon: TrendingUp,
      title: "Real-time Trend Detection",
      desc: "We track what's accelerating right now across your category, not what was hot last quarter.",
    },
    {
      icon: FileSpreadsheet,
      title: "One-click Export",
      desc: "Every analysis exports into a clean, shareable spreadsheet your whole team can use.",
    },
    {
      icon: Database,
      title: "Persistent Memory",
      desc: "Your channel history and past reports are stored, so every new analysis gets sharper.",
    },
    {
      icon: Zap,
      title: "Seconds, not hours",
      desc: "What used to take a research team a day now finishes before your coffee gets cold.",
    },
  ];

  return (
    <section id="features" className="relative py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Reveal>
            <span className="text-xs uppercase tracking-widest text-violet-300/80">Capabilities</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white">
              Built for signal, not noise
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <TiltCard key={f.title} {...f} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   HOW IT WORKS — horizontal-feel scroll steps
------------------------------------------------------------------------- */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Connect your channel", desc: "Link your YouTube channel in seconds. No heavy setup." },
    { n: "02", title: "We embed & analyze", desc: "Content and trend data are embedded and cross-referenced." },
    { n: "03", title: "AI reasons over signals", desc: "AI-powered reasoning finds your highest-leverage move." },
    { n: "04", title: "Get your report", desc: "A clean, exportable report lands in your dashboard and inbox." },
  ];

  return (
    <section id="how-it-works" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-20">
          <Reveal>
            <span className="text-xs uppercase tracking-widest text-violet-300/80">Process</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white">From connect to clarity</h2>
          </Reveal>
        </div>

        <div className="relative flex flex-col gap-16">
          <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-violet-400/60 via-pink-400/40 to-transparent md:left-1/2" />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.05}>
              <div
                className={`relative flex items-start gap-6 md:w-1/2 ${
                  i % 2 === 1 ? "md:ml-auto md:flex-row-reverse md:text-right" : ""
                }`}
              >
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-violet-400/40 bg-black text-sm font-semibold text-violet-300">
                  {s.n}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-white/55">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   SOCIAL PROOF MARQUEE
------------------------------------------------------------------------- */
function SocialProof() {
  const items = [
    "\"Finally, insight instead of guesswork.\"",
    "\"Cut my research time by 90%.\"",
    "\"Feels like having a data team.\"",
    "\"The trend detection alone is worth it.\"",
    "\"My exports go straight into my planning doc.\"",
  ];
  return (
    <section className="py-20 border-y border-white/5">
      <Marquee items={items} />
      <Marquee items={[...items].reverse()} reverse />
    </section>
  );
}

/* -------------------------------------------------------------------------
   FINAL CTA
------------------------------------------------------------------------- */
function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.1, 0.9]);

  return (
    <section ref={ref} className="relative py-40 px-6 overflow-hidden">
      <motion.div
        style={{ scale: bgScale }}
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(167,139,250,0.25),transparent_60%)]"
      />
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
            Stop reading noise.
            <br /> Start acting on signal.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-6 text-white/55 max-w-xl mx-auto">
            Join creators who turned guesswork into a repeatable, AI-driven content
            strategy.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="group flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-transform hover:scale-105">
              Get started for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Check className="h-4 w-4 text-violet-300" /> No credit card required
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   FOOTER
------------------------------------------------------------------------- */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
            <Radio className="h-3 w-3 text-black" />
          </div>
          <span className="text-sm text-white/60">ContelliSense &copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-white/40">
          <a href="#" className="hover:text-white/70 transition-colors">Privacy</a>
          <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
          <a href="#" className="hover:text-white/70 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------
   PAGE
------------------------------------------------------------------------- */
export default function Page() {
  useLenis();

  return (
    <main className="relative bg-black text-white selection:bg-violet-500/30 overflow-x-hidden">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <HowItWorks />
      <SocialProof />
      <FinalCTA />
      <Footer />
    </main>
  );
}
