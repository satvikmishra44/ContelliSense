"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import {
  Brain,
  TrendingUp,
  FileSpreadsheet,
  Zap,
  ArrowRight,
  PlaySquare,
  Radio,
  Menu,
  X,
  Check,
  Moon,
  Sun,
  Activity,
  Compass,
  Cpu,
  Target,
  Clock,
  ChevronDown,
  TerminalSquare,
  Sparkles,
  BarChart,
  LineChart,
} from "lucide-react";

/* -------------------------------------------------------------------------
   SYSTEM: SMOOTH SCROLL (Lenis)
------------------------------------------------------------------------- */
function useLenis() {
  useEffect(() => {
    let lenis: any;
    let rafId: number;

    (async () => {
      const LenisModule = await import("lenis");
      const Lenis = LenisModule.default;
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
   SYSTEM: THEME PROVIDER
------------------------------------------------------------------------- */

type Theme = "dark" | "light";

const ThemeContext = React.createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "dark",
  toggleTheme: () => {},
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

const useTheme = () => React.useContext(ThemeContext);

/* -------------------------------------------------------------------------
   PRIMITIVE: REVEAL ON SCROLL
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
   BACKGROUNDS: NOISE CANVAS & GRID
------------------------------------------------------------------------- */

function NoiseToSignalCanvas({ progress }: { progress: any }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<
    { x: number; y: number; baseX: number; baseY: number; r: number; hue: number }[]
  >([]);
  const progressVal = useRef(0);
  const { theme } = useTheme();

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
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.width / window.devicePixelRatio;
    const H = () => canvas.height / window.devicePixelRatio;
    const COUNT = 200;

    particles.current = Array.from({ length: COUNT }).map((_, i) => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      baseX: (i / COUNT) * W(),
      baseY: H() / 2,
      r: Math.random() * 1.5 + 0.5,
      hue: 260 + Math.random() * 40,
    }));

    let raf: number;
    let t = 0;

    const render = () => {
      t += 0.01;
      ctx.clearRect(0, 0, W(), H());
      const p = progressVal.current;
      const isLight = theme === "light";
      const baseLightness = isLight ? 40 : 65;
      const alphaBase = isLight ? 0.5 : 0.3;

      particles.current.forEach((pt, i) => {
        const wave = Math.sin(pt.baseX * 0.02 + t) * 60 * (1 - p * 0.5);
        const targetX = pt.baseX;
        const targetY = H() / 2 + wave;

        pt.x += (targetX - pt.x) * (0.02 + p * 0.08);
        pt.y += (targetY - pt.y) * (0.02 + p * 0.08);

        const jitter = (1 - p) * 60;
        const jx = pt.x + Math.sin(t * 2 + i) * jitter * 0.1;
        const jy = pt.y + Math.cos(t * 2 + i) * jitter * 0.1;

        ctx.beginPath();
        ctx.arc(jx, jy, pt.r + p * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${pt.hue}, 90%, ${baseLightness + p * 20}%, ${alphaBase + p * 0.4})`;
        ctx.fill();

        if (i > 0 && p > 0.4) {
          const prev = particles.current[i - 1];
          const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
          if (dist < 40) {
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(pt.x, pt.y);
            ctx.strokeStyle = `hsla(265, 90%, ${baseLightness}%, ${(p - 0.4) * (isLight ? 0.3 : 0.8)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      raf = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

function InteractiveGrid() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlight = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(800px circle at ${x}px ${y}px, rgba(139,92,246,0.12), transparent 40%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const rect = containerRef.current?.getBoundingClientRect() || {
      left: 0,
      top: 0,
    };
    mouseX.set(clientX - rect.left);
    mouseY.set(clientY - rect.top);
  };

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} className="absolute inset-0">
      <motion.div
        className="absolute inset-0 opacity-0 dark:opacity-40 transition-opacity duration-500"
        style={{ background: spotlight }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   NAVBAR
------------------------------------------------------------------------- */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Manifesto", "Capabilities", "Workflow", "FAQ"];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={
        "fixed top-0 z-50 w-full transition-all duration-500" +
        (scrolled
          ? " bg-white/70 dark:bg-black/50 backdrop-blur-2xl border-b border-slate-200 dark:border-white/10 py-3"
          : " bg-transparent py-6")
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <button
          className="flex items-center gap-2.5 group cursor-pointer text-slate-900 dark:text-white font-semibold"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Radio className="h-5 w-5 text-violet-500" />
          ContelliSense
        </button>

        <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-white/5 p-1 rounded-full border border-slate-200/50 dark:border-white/10 backdrop-blur-md">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="px-5 py-2 rounded-full text-sm font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 hover:bg-white dark:hover:text-white dark:hover:bg-white/10 transition-all"
            >
              {l}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-white/70"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <a
            href="/dashboard"
            className="text-sm font-semibold text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Log in
          </a>
          <a
            href="/dashboard"
            className="relative group overflow-hidden rounded-full bg-slate-900 dark:bg_white px-6 py-2.5 text-sm font-bold text-white dark:text-black hover:scale-105 transition-transform duration-300"
          >
            <span className="relative z-10">Deploy Agent</span>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-500 opacity-0 group-hover:opacity-100 dark:from-violet-400 dark:to-pink-400 dark:opacity-0 dark:group-hover:opacity-20 transition-opacity duration-300" />
          </a>
        </div>

        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="text-slate-600 dark:text-white"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <button
            className="text-slate-900 dark:text-white"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white/95 dark:bg-black/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10"
          >
            <div className="flex flex-col gap-2 px-6 py-8">
              {links.map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-slate-600 dark:text-white/70 text-lg font-medium hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  {l}
                </a>
              ))}
              <hr className="border-slate-200 dark:border-white/10 my-4" />
              <a
                href="/dashboard"
                className="w-full text-center rounded-xl bg-slate-900 dark:bg-white py-4 text-base font-bold text-white dark:text-black"
              >
                Deploy Agent
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* -------------------------------------------------------------------------
   HERO SECTION
------------------------------------------------------------------------- */

function LiveAgentConsole() {
  const lines = [
    "Establishing secure connection to YouTube API...",
    "Ingesting 100 most recent uploads...",
    "Calculating baseline engagement coefficient: 4.2%",
    "Cross-referencing global search velocity for niche...",
    "Anomaly detected: 'Micro-SaaS' queries +312% 7d",
    "Synthesizing psychographic hook parameters...",
    "Compiling strategy matrix.",
  ];

  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine((prev) => (prev + 1) % lines.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.span
      key={currentLine}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="text-[13px] font-mono font-medium text-slate-600 dark:text-white/70 whitespace-nowrap"
    >
      {"> "}
      {lines[currentLine]}
    </motion.span>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      <motion.div style={{ opacity: opacity, scale }} className="absolute inset-0">
        <NoiseToSignalCanvas progress={scrollYProgress} />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/80 to-slate-50 dark:via-zinc-950/80 dark:to-zinc-950 pointer-events-none" />
      <InteractiveGrid />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 flex flex-col items-center text-center px-6 pt-32"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-violet-200 dark:border-violet-500/20 bg-white/50 dark:bg-violet-500/10 px-5 py-2 text-sm font-bold tracking-wide text-violet-700 dark:text-violet-300 backdrop-blur-xl shadow-sm uppercase"
        >
          <Sparkles className="h-4 w-4" />
          ContelliSense Agent OS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-extrabold tracking-tighter text-slate-900 dark:text-white max-w-[70rem] leading-[0.95]"
        >
          Hire an AI to build your <br className="hidden md:block" />
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-violet-600 to-pink-500 dark:from-violet-400 dark:to-pink-400 bg-clip-text text-transparent">
              content strategy.
            </span>
            <span className="absolute bottom-2 left-0 w-full h-4 bg-violet-200 dark:bg-violet-900/40 -z-10 blur-sm rounded-full mix-blend-multiply dark:mix-blend-lighten" />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-8 max-w-2xl text-lg sm:text-xl font-medium text-slate-600 dark:text-white/60 leading-relaxed text-balance"
        >
          Stop guessing what your audience wants. Deploy an autonomous agent that
          ingests your channel history, scans market velocity, and engineers your
          next viral concept.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
        >
          <a
            href="/dashboard"
            className="group relative w-full sm:w-auto flex items-center justify-center gap-3 rounded-full bg-slate-900 dark:bg-white px-10 py-4 text-base font-bold text-white dark:text-black overflow-hidden shadow-xl dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              Initialize Agent
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-500 opacity-0 group-hover:opacity-100 dark:from-violet-400 dark:to-pink-400 dark:opacity-0 dark:group-hover:opacity-20 transition-opacity duration-300" />
          </a>

          <a
            href="#workflow"
            className="group w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md px-10 py-4 text-base font-bold text-slate-700 dark:text-white hover:bg-white dark:hover:bg-white/10 transition-colors"
          >
            <PlaySquare className="h-4 w-4 text-slate-400 dark:text-white/50 group-hover:text-violet-500 transition-colors" />
            View Process
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }}>
          <LiveAgentConsole />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3 text-slate-400 dark:text-white/40"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-6 w-6 opacity-50" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   MANIFESTO (Text Reveal)
------------------------------------------------------------------------- */

function Manifesto() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.4"] });

  const words =
    "Creation is fundamentally human. But parsing terabytes of algorithmic market data to find the one concept that will actually perform? That is a job for a machine.".split(
      " "
    );

  return (
    <section
      id="manifesto"
      ref={ref}
      className="py-24 bg-white dark:bg-zinc-950"
    >
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
          The Paradigm Shift
        </h2>
        <p className="text-xl leading-relaxed flex flex-wrap gap-2">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);
            return (
              <motion.span
                key={i}
                style={{ opacity }}
                className="text-slate-900 dark:text-white"
              >
                {word}
              </motion.span>
            );
          })}
        </p>
        <p className="mt-8 text-sm text-slate-600 dark:text-white/60">
          Stop acting like an analyst. ContelliSense acts as your Chief Strategy
          Officer, continuously monitoring the YouTube ecosystem so you can
          focus entirely on production.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   BENTO GRID (The Agent's Toolkit)
------------------------------------------------------------------------- */

function BentoGrid() {
  return (
    <section id="capabilities" className="py-24 bg-slate-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
            The Intelligence Engine
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-white/60">
            A look inside the agent's processing layers. Not a dashboard of
            useless graphs—but actionable, synthesized directives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">
          {/* Bento 1: Large Wide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-2 group relative overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/40 p-8 md:p-12 backdrop-blur-xl flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:bg-violet-500/20 dark:group-hover:bg-violet-500/30 transition-colors duration-700" />
            <div className="relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-white/10 flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-violet-600 dark:text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Strategic Hook Synthesis
              </h3>
              <p className="text-slate-600 dark:text-white/60 max-w-md leading-relaxed">
                The agent doesn't just give you a title. It writes the exact
                psychological hook required for the first 5 seconds of your
                video to maximize retention.
              </p>
            </div>

            <div className="relative mt-8 bg-slate-900 dark:bg-white/5 border border-slate-800 dark:border-white/10 rounded-xl p-5 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-mono text-white/40 ml-2">
                  agent-output.log
                </span>
              </div>
              <p className="font-mono text-sm text-green-400">
                <span className="text-white/50">[Generated Hook] </span>
                <br />
                "You probably think 10,000 steps a day is the secret to fat
                loss. But new data shows you're wasting 45 minutes every
                morning..."
              </p>
            </div>
          </motion.div>

          {/* Bento 2: Tall */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/40 p-8 backdrop-blur-xl flex flex-col justify-between"
          >
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-pink-500/10 to-transparent dark:from-pink-500/20" />
            <div className="relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-pink-100 dark:bg-white/10 flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-pink-600 dark:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Velocity Tracker
              </h3>
              <p className="text-slate-600 dark:text-white/60 leading-relaxed text-sm">
                Monitors search trends globally. Catch waves before they peak,
                not after the market is saturated.
              </p>
            </div>
            <div className="relative mt-8 h-32 flex items-end gap-2 justify-center pb-4">
              {[40, 65, 45, 80, 55, 100].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                  className="w-8 rounded-t-sm bg-gradient-to-t from-pink-500/50 to-pink-400 dark:from-pink-500/80 dark:to-white"
                />
              ))}
            </div>
          </motion.div>

          {/* Bento 3: Square */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/40 p-8 backdrop-blur-xl"
          >
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-white/10 flex items-center justify-center mb-6">
              <Brain className="h-6 w-6 text-blue-600 dark:text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Contextual Memory
            </h3>
            <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">
              Scans your last 100 uploads. It learns your unique visual and
              narrative style to suggest concepts you can actually execute.
            </p>
          </motion.div>

          {/* Bento 4: Large Wide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="md:col-span-2 group relative overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 bg-slate-900 dark:bg-zinc-950 p-8 md:p-12 flex flex-col justify-center"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay" />
            <div className="relative z-10 md:w-2/3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white mb-6 uppercase tracking-wider">
                <FileSpreadsheet className="h-3.5 w-3.5" /> Production Ready
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                One-click brief export.
              </h3>
              <p className="text-white/60 text-lg">
                The agent compiles everything—titles, hooks, thumbnail
                concepts, and virality scores—into a structured Excel matrix
                ready for your production team.
              </p>
            </div>

            <motion.div
              animate={{ y: [-10, 10, -10], rotate: [0, 2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="hidden md:flex absolute right-12 top-1/2 -translate-y-1/2 h-40 w-40 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md items-center justify-center shadow-2xl"
            >
              <div className="h-20 w-20 rounded-full border-4 border-green-400/50 border-t-green-400 animate-spin" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   WORKFLOW PIPELINE
------------------------------------------------------------------------- */

function PipelineDiagram() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.2"] });
  const pathLength = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  const nodes = [
    { icon: PlaySquare, label: "Channel Sync", desc: "Agent reads your history" },
    { icon: Target, label: "Market Mapping", desc: "Scans global niche vectors" },
    { icon: Brain, label: "Logic Processing", desc: "Cross-references data" },
    { icon: Zap, label: "Strategy Matrix", desc: "Exports actionable briefs" },
  ];

  return (
    <section id="workflow" className="py-24 bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        <h2 className="mb-8 text-sm font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
          Autonomous Execution
        </h2>
        <div className="relative w-full">
          <svg
            className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-32 hidden md:block z-0"
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
          >
            <path
              d="M 40 50 C 250 -30, 350 130, 500 50 S 750 -30, 960 50"
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-white/10"
              strokeWidth="2"
              strokeDasharray="8 8"
            />
            <motion.path
              d="M 40 50 C 250 -30, 350 130, 500 50 S 750 -30, 960 50"
              fill="none"
              stroke="url(#agent-grad)"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ pathLength }}
            />
            <defs>
              <linearGradient id="agent-grad" x1="0" x2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-4">
            {nodes.map((n, i) => (
              <motion.div
                key={n.label}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative h-20 w-20 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-xl flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-300">
                    <n.icon className="h-8 w-8 text-violet-600 dark:text-white" strokeWidth={1.5} />
                  </div>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {n.label}
                </span>
                <span className="text-sm text-slate-500 dark:text-white/60">
                  {n.desc}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   METRICS / COUNTERS
------------------------------------------------------------------------- */

function Counter({ to, suffix = "", label }: { to: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / 2000);
            setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to));
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
    <div ref={ref} className="flex flex-col items-center">
      <div className="text-4xl font-extrabold text-slate-900 dark:text-white">
        {val}
        {suffix}
      </div>
      <div className="mt-1 text-xs text-slate-500 dark:text-white/60">{label}</div>
    </div>
  );
}

function Metrics() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <Counter to={312} suffix="%" label="Avg. velocity uplift" />
        <Counter to={47} suffix="min" label="Research time saved per brief" />
        <Counter to={100} suffix="+" label="Videos analyzed per run" />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   MARQUEE (Social Proof)
------------------------------------------------------------------------- */

function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex gap-6 w-max"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      >
        {[...items, ...items].map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-zinc-900 px-5 py-2 text-xs text-slate-600 dark:text-white/70"
          >
            {t}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   FAQ ACCORDION
------------------------------------------------------------------------- */

function FAQ() {
  const faqs = [
    {
      q: "How is this different from generic ChatGPT prompts?",
      a: "ContelliSense does not require prompting. It connects directly to the YouTube API, ingests your historical performance data, and maps it against live global search velocity to generate mathematical probabilities of success, not just creative guesses.",
    },
    {
      q: "Do I need to install any software?",
      a: "No. ContelliSense operates entirely in the cloud as a web-based agent. Simply provide your YouTube URL, and the server-side intelligence handles the heavy lifting.",
    },
    {
      q: "How does the 'Contextual Memory' work?",
      a: "The agent analyzes your past 100 videos, reading the metadata, engagement rates, and view velocity. It builds a semantic profile of your niche so every recommendation feels like it came from your own brain, just optimized.",
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-8 text-sm font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
          Intelligence Briefing
        </h2>
        <div className="divide-y divide-slate-200 dark:divide-white/10">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="py-3">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
              >
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {faq.q}
                </span>
                <motion.div
                  animate={{ rotate: openIdx === i ? 180 : 0 }}
                  className="text-slate-400 dark:text-white/50"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-4 pb-4"
                  >
                    <p className="text-xs text-slate-600 dark:text-white/60">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   FINAL CTA
------------------------------------------------------------------------- */

function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 via-slate-900 to-black">
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center px-6">
        <Reveal>
          <div className="h-20 w-20 mb-8 mx-auto rounded-3xl bg-gradient-to-br from-violet-600 to-pink-500 p-[2px] shadow-[0_0_50px_-10px_rgba(139,92,246,0.5)]">
            <div className="h-full w-full bg-slate-900 dark:bg-black rounded-[22px] flex items-center justify-center">
              <Brain className="h-10 w-10 text-white" />
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight text-center">
            Stop researching.
            <br />
            Start creating.
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-6 text-xl text-white/60 max-w-2xl mx-auto text-center">
            The agent is online and ready to process your channel coordinates.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <a
            href="/dashboard"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-lg font-bold text-black hover:scale-105 transition-transform shadow-2xl"
          >
            Initialize Agent Now
            <ArrowRight className="h-5 w-5" />
          </a>
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
    <footer className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-black py-6">
      <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-white/50">
        <span>ContelliSense OS © {new Date().getFullYear()} AI Strategy Agent. All systems nominal.</span>
        <span className="flex items-center gap-2">
          <Activity className="h-3 w-3" />
          Status: Online
        </span>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------
   PAGE COMPONENT
------------------------------------------------------------------------- */

export default function Page() {
  useLenis();

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <Navbar />
        <main className="pt-20">
          <Hero />
          <Manifesto />
          <BentoGrid />
          <PipelineDiagram />
          <Metrics />

          <section className="py-24 bg-white dark:bg-zinc-950 transition-colors">
            <div className="mx-auto max-w-6xl px-6 text-center mb-12">
              <span className="text-sm font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">
                Logs from deployed agents
              </span>
            </div>
            <div className="mx-auto max-w-6xl px-6 flex flex-col gap-6">
              <Marquee
                items={[
                  "It's like having a full-time YouTube strategist on staff.",
                  "Replaced my 3-hour Sunday research session.",
                  "I just open the brief, read the angle, and start filming.",
                ]}
              />

              <Marquee
                reverse
                items={[
                  "The agent found a micro-trend I entirely missed.",
                  "Finally, I'm focusing on creation again.",
                  "Unbelievable accuracy in hook generation.",
                ]}
              />
            </div>
          </section>

          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
