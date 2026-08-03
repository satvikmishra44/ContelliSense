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
  PlaySquare, // Replaced Youtube with PlaySquare
  BarChart3,
  Layers,
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
  Clock
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
   THEME PROVIDER (Context)
------------------------------------------------------------------------- */
type Theme = "dark" | "light";
const ThemeContext = React.createContext<{ theme: Theme; toggleTheme: () => void }>({
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

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

const useTheme = () => React.useContext(ThemeContext);

/* -------------------------------------------------------------------------
   NOISE -> SIGNAL CANVAS (Hero Background)
------------------------------------------------------------------------- */
function NoiseToSignalCanvas({ progress }: { progress: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<{ x: number; y: number; baseX: number; baseY: number; r: number; hue: number }[]>([]);
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
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;
    const COUNT = 250;

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

      const isLight = theme === "light";
      const baseLightness = isLight ? 40 : 60;
      const alphaBase = isLight ? 0.6 : 0.35;
      const strokeAlphaBase = isLight ? 0.4 : 0.9;

      particles.current.forEach((pt, i) => {
        // As scroll progresses, particles form a tight sine wave
        const wave =
          Math.sin(pt.baseX * 0.02 + t) * 50 * (1 - p * 0.4) +
          Math.sin(pt.baseX * 0.008 + t * 0.6) * 20;
        const targetX = pt.baseX;
        const targetY = H() / 2 + wave;

        pt.x += (targetX - pt.x) * (0.02 + p * 0.06);
        pt.y += (targetY - pt.y) * (0.02 + p * 0.06);

        const jitter = (1 - p) * 80;
        const jx = pt.x + Math.sin(t * 2 + i) * jitter * 0.15;
        const jy = pt.y + Math.cos(t * 2 + i) * jitter * 0.15;

        ctx.beginPath();
        ctx.arc(jx, jy, pt.r + p * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${pt.hue}, 90%, ${baseLightness + p * 15}%, ${alphaBase + p * 0.5})`;
        ctx.fill();

        if (i > 0 && p > 0.35) {
          const prev = particles.current[i - 1];
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.strokeStyle = `hsla(265, 90%, ${baseLightness}%, ${(p - 0.35) * strokeAlphaBase})`;
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
  }, [theme]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-60 dark:opacity-100" />;
}

/* -------------------------------------------------------------------------
   INTERACTIVE GRID BACKGROUND (Reacts to Mouse)
------------------------------------------------------------------------- */
function InteractiveGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top } = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 -z-20 overflow-hidden pointer-events-none"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)]" />
      <motion.div
        className="absolute inset-0 opacity-0 dark:opacity-30 transition-opacity duration-300"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(167,139,250,0.15), transparent 40%)`
          ),
        }}
      />
    </div>
  );
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
          const duration = 2000;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
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
    <div ref={ref} className="text-center group">
      <div className="text-5xl md:text-7xl font-bold bg-gradient-to-br from-violet-600 to-pink-500 dark:from-white dark:to-violet-300 bg-clip-text text-transparent tabular-nums drop-shadow-sm group-hover:scale-105 transition-transform duration-500">
        {val.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-4 text-sm md:text-base font-medium text-slate-600 dark:text-white/60 max-w-[200px] mx-auto leading-tight">{label}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   AGENT PIPELINE DIAGRAM — draws itself as you scroll through the section
------------------------------------------------------------------------- */
function PipelineDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });
  const pathLength = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  const nodes = [
    { icon: PlaySquare, label: "Raw Channel Pulse", x: "8%", desc: "Ingests daily content" },
    { icon: Target, label: "Pattern Recognition", x: "32%", desc: "Identifies winning angles" },
    { icon: Brain, label: "Agentic Reasoning", x: "56%", desc: "Formulates strategy" },
    { icon: Zap, label: "Actionable Brief", x: "80%", desc: "Ready to film" },
  ];

  return (
    <div ref={ref} className="relative w-full py-24 md:py-32">
      {/* Animated Path */}
      <svg
        className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-32 hidden md:block z-0"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
      >
        {/* Background track */}
        <path
          d="M 40 50 C 250 -30, 350 130, 500 50 S 750 -30, 960 50"
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-white/10"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Animated Fill */}
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
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
        {nodes.map((n, i) => (
          <motion.div
            key={n.label}
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: i * 0.2, type: "spring", bounce: 0.4 }}
            className="flex flex-col items-center gap-4 text-center group"
          >
            <div className="relative">
              {/* Pulse effect behind icon */}
              <div className="absolute inset-0 bg-violet-400/20 rounded-2xl blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-20 w-20 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl flex items-center justify-center shadow-lg dark:shadow-[0_0_40px_-10px_rgba(167,139,250,0.3)] transition-transform duration-300 group-hover:-translate-y-2 group-hover:border-violet-400/50">
                <n.icon className="h-8 w-8 text-violet-600 dark:text-violet-300" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-800 dark:text-white mb-1">{n.label}</span>
              <span className="text-xs text-slate-500 dark:text-white/50">{n.desc}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   TILT CARD (Feature Card)
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
    rotateY.set(px * 18);
    rotateX.set(-py * 18);
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
      className="h-full"
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        style={{ rotateX: sRotateX, rotateY: sRotateY, transformStyle: "preserve-3d" }}
        className="group relative h-full rounded-3xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-gradient-to-b dark:from-white/[0.06] dark:to-white/[0.02] p-8 backdrop-blur-xl overflow-hidden shadow-sm dark:shadow-none hover:shadow-xl dark:hover:shadow-none transition-shadow"
      >
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-violet-500/10 dark:bg-violet-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div 
          className="h-14 w-14 rounded-2xl bg-violet-100 dark:bg-white/5 border border-violet-200 dark:border-white/10 flex items-center justify-center mb-6 transform-gpu"
          style={{ transform: "translateZ(40px)" }}
        >
          <Icon className="h-7 w-7 text-violet-600 dark:text-violet-300" strokeWidth={1.5} />
        </div>
        
        <div style={{ transform: "translateZ(30px)" }}>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">{desc}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------
   MARQUEE
------------------------------------------------------------------------- */
function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <div className="relative overflow-hidden py-5 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex gap-6 w-max"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 35, ease: "linear", repeat: Infinity }}
      >
        {[...items, ...items].map((t, i) => (
          <div
            key={i}
            className="whitespace-nowrap rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-6 py-4 text-sm font-medium text-slate-700 dark:text-white/70 shadow-sm dark:shadow-none"
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
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Autopilot", "Features", "Workflow", "Pricing"];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled 
          ? "bg-white/80 dark:bg-black/60 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ContelliSense</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 bg-white/50 dark:bg-white/5 px-6 py-2 rounded-full border border-slate-200 dark:border-white/10 backdrop-blur-md">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm font-medium text-slate-600 dark:text-white/70 hover:text-violet-600 dark:hover:text-white transition-colors"
            >
              {l}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-white/70"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="text-sm font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors">Log in</button>
          <button className="rounded-full bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-bold text-white dark:text-black hover:scale-105 transition-transform shadow-lg dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]">
            Deploy Agent
          </button>
        </div>

        <div className="md:hidden flex items-center gap-4">
          <button onClick={toggleTheme} className="text-slate-600 dark:text-white">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button className="text-slate-900 dark:text-white" onClick={() => setOpen(!open)}>
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
            className="md:hidden overflow-hidden bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10"
          >
            <div className="flex flex-col gap-4 px-6 py-8">
              {links.map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().replace(/\s/g, "-")}`}
                  onClick={() => setOpen(false)}
                  className="text-slate-600 dark:text-white/70 text-lg font-medium"
                >
                  {l}
                </a>
              ))}
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <button className="w-full rounded-xl bg-slate-900 dark:bg-white py-3 text-base font-bold text-white dark:text-black">
                Deploy Agent
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
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const canvasOpacity = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <div ref={ref} className="relative h-[140vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center">
        
        {/* Background Layer */}
        <div className="absolute inset-0 bg-slate-50 dark:bg-black transition-colors duration-500" />
        <InteractiveGrid />

        <motion.div style={{ opacity: canvasOpacity, scale }} className="absolute inset-0">
          <NoiseToSignalCanvas progress={scrollYProgress} />
        </motion.div>

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50 dark:via-black/50 dark:to-black pointer-events-none transition-colors duration-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(167,139,250,0.1),transparent_50%)] pointer-events-none" />

        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="relative z-10 flex flex-col items-center text-center px-6 mt-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/20 dark:border-white/10 bg-violet-500/10 dark:bg-white/5 px-5 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 backdrop-blur-xl shadow-sm"
          >
            <Brain className="h-4 w-4" />
            Your Autonomous YouTube Agent
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-extrabold tracking-tighter text-slate-900 dark:text-white max-w-5xl leading-[0.95]"
          >
            Focus on{" "}
            <span className="italic font-serif font-light text-slate-600 dark:text-slate-400">when</span> to create. <br className="hidden md:block" />
            Let AI tell you{" "}
            <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-blue-500 dark:from-violet-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent drop-shadow-sm">
              what
            </span>{" "}
            to create.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.8 }}
            className="mt-8 max-w-2xl text-lg sm:text-xl font-medium text-slate-600 dark:text-white/60 leading-relaxed"
          >
            ContelliSense saves you countless hours by replacing guesswork with data dynamics. 
            Our agent analyzes the market, detects accelerating trends, and hands you the exact concepts that move your channel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8 }}
            className="mt-12 flex flex-col sm:flex-row items-center gap-5"
          >
            <button className="group relative flex items-center justify-center gap-3 rounded-full bg-slate-900 dark:bg-white px-8 py-4 text-base font-bold text-white dark:text-black overflow-hidden shadow-xl dark:shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)] transition-all hover:scale-105 hover:shadow-2xl active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                Deploy Agent Now
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-500 opacity-0 group-hover:opacity-100 dark:from-violet-400 dark:to-pink-400 dark:opacity-0 dark:group-hover:opacity-20 transition-opacity duration-300" />
            </button>
            <button className="group flex items-center gap-2 rounded-full border-2 border-slate-200 dark:border-white/15 px-8 py-4 text-base font-bold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              <PlaySquare className="h-5 w-5 text-slate-400 dark:text-white/50 group-hover:text-violet-500 transition-colors" />
              See how it works
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-10 flex flex-col items-center gap-3 text-slate-400 dark:text-white/40"
        >
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Engage Autopilot</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="h-10 w-6 rounded-full border-2 border-slate-300 dark:border-white/20 flex items-start justify-center p-1.5"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-white/60" />
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
    "You are an artist, not an analyst. Yet, the creator economy demands you sift through terabytes of market noise to find one good idea.".split(
      " "
    );
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section id="autopilot" ref={ref} className="relative py-32 px-6 overflow-hidden bg-white dark:bg-black transition-colors duration-500">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Animated background rings */}
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-slate-100 dark:border-white/5 rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }} 
          transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-slate-100 dark:border-white/[0.03] rounded-full border-dashed"
        />
      </div>

      <div className="mx-auto max-w-5xl text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 mb-6 text-sm font-bold tracking-widest uppercase text-pink-500 dark:text-pink-400">
            <Clock className="h-4 w-4" /> Stop Wasting Time
          </div>
        </Reveal>

        <p className="mt-4 text-3xl sm:text-5xl md:text-6xl font-bold leading-tight text-slate-900 dark:text-white/90">
          {words.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.1, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.04, duration: 0.5 }}
              className="inline-block mr-[0.25em]"
            >
              {w}
            </motion.span>
          ))}
        </p>

        <Reveal delay={0.4}>
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <Counter to={80} suffix="%" label="of creators suffer burnout from research fatigue" />
            <Counter to={5} suffix="M+" label="data points generated daily in your niche" />
            <Counter to={0} suffix="" label="manual hours required when using ContelliSense" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   SOLUTION SECTION (Agent Workflow)
------------------------------------------------------------------------- */
function Solution() {
  return (
    <section id="workflow" className="relative py-32 px-6 bg-slate-50 dark:bg-zinc-950 transition-colors duration-500 border-y border-slate-200 dark:border-white/5">
      <InteractiveGrid />
      <div className="mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-12">
          <Reveal>
            <div className="inline-flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-violet-600 dark:text-violet-400">
              <Activity className="h-4 w-4" /> The AI Workflow
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-6 text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight tracking-tight">
              An agent that thinks like a strategist, executes like a machine.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-lg max-w-2xl mx-auto text-slate-600 dark:text-white/60 font-medium">
              We replace tedious manual analysis with an autonomous pipeline. It watches your market, identifies what works, and hands you the blueprint.
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
      icon: Target,
      title: "Hyper-Targeted Concepts",
      desc: "Our agent maps exact audience desires to your channel style, ensuring every recommended video hits the mark.",
    },
    {
      icon: TrendingUp,
      title: "Accelerating Trend Detection",
      desc: "Catch waves before they peak. We flag topics that are gaining momentum in real-time, not yesterday's news.",
    },
    {
      icon: Brain,
      title: "Contextual Memory",
      desc: "The agent remembers your past hits and flops. Every brief gets smarter and more tailored to your unique voice.",
    },
    {
      icon: FileSpreadsheet,
      title: "Export to Production",
      desc: "Generate complete production briefs and structured spreadsheets instantly. From idea to execution in one click.",
    },
    {
      icon: Cpu,
      title: "Autonomous Monitoring",
      desc: "While you sleep, the agent scans millions of interactions in your niche, preparing your next move.",
    },
    {
      icon: Zap,
      title: "Zero Setup Required",
      desc: "Just connect your channel. No complex dashboards, no prompts to write. Pure signal delivered to your inbox.",
    },
  ];

  return (
    <section id="features" className="relative py-32 px-6 bg-white dark:bg-black transition-colors duration-500">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-20 flex flex-col items-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-white/70">
              <Compass className="h-4 w-4 text-pink-500" /> Capabilities
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-6 text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Your unfair advantage
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((f, i) => (
            <TiltCard key={f.title} {...f} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   PARALLAX SCROLL SECTION (Storytelling)
------------------------------------------------------------------------- */
function StorySection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 0.3]);

  return (
    <section ref={ref} className="relative py-40 px-6 bg-slate-900 dark:bg-zinc-950 overflow-hidden rounded-[3rem] mx-4 md:mx-10 my-10 border border-slate-800 dark:border-white/5">
      <motion.div style={{ opacity }} className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
      
      <div className="mx-auto max-w-5xl relative z-10 flex flex-col md:flex-row items-center gap-16">
        <motion.div style={{ y: y1 }} className="flex-1">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Stop guessing.<br/>
            <span className="text-violet-400">Start predicting.</span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            Every video is an investment of your time. ContelliSense acts as your Chief Strategy Officer, giving you data-backed confidence before you ever hit record. It’s not just an analytics tool; it’s an agent that works on your business so you can work in it.
          </p>
        </motion.div>
        
        <motion.div style={{ y: y2 }} className="flex-1 relative">
          <div className="aspect-square rounded-3xl bg-gradient-to-tr from-violet-600/30 to-pink-500/30 border border-white/10 backdrop-blur-xl p-8 flex items-center justify-center relative overflow-hidden">
            {/* Abstract UI representation */}
            <div className="absolute inset-0 flex items-center justify-center opacity-50">
              <div className="w-[150%] h-[150%] animate-[spin_20s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)]" />
            </div>
            <div className="absolute inset-1 bg-slate-900 rounded-[1.3rem] flex flex-col items-center justify-center gap-6 z-10">
              <Brain className="h-16 w-16 text-white/80" />
              <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }} 
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="h-full w-1/2 bg-violet-400 rounded-full"
                />
              </div>
              <span className="text-xs text-white/50 font-mono">AGENT PROCESSING</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   SOCIAL PROOF MARQUEE
------------------------------------------------------------------------- */
function SocialProof() {
  const items = [
    "\"It's like having a full-time YouTube strategist on staff.\"",
    "\"Replaced my 3-hour Sunday research session.\"",
    "\"I just open the brief, read the angle, and start filming.\"",
    "\"The agent found a micro-trend I entirely missed.\"",
    "\"Finally, I'm focusing on creation again.\"",
  ];
  return (
    <section className="py-24 bg-white dark:bg-black transition-colors duration-500 overflow-hidden">
      <div className="text-center mb-12">
        <span className="text-sm font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Trusted by creators shaping the future</span>
      </div>
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
  const bgScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={ref} className="relative py-48 px-6 overflow-hidden bg-slate-50 dark:bg-zinc-950 transition-colors duration-500">
      <motion.div
        style={{ scale: bgScale }}
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(167,139,250,0.25),transparent_60%)]"
      />
      <motion.div style={{ y }} className="mx-auto max-w-4xl text-center">
        <Reveal>
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 p-[2px] mb-8 shadow-2xl">
            <div className="h-full w-full bg-white dark:bg-black rounded-[14px] flex items-center justify-center">
              <Radio className="h-8 w-8 text-slate-900 dark:text-white" />
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-5xl sm:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
            Ready to hire your AI agent?
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-6 text-xl text-slate-600 dark:text-white/60 max-w-2xl mx-auto font-medium">
            Connect your channel today and let ContelliSense map out your next viral hit.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
            <button className="group relative flex items-center justify-center gap-3 rounded-full bg-slate-900 dark:bg-white px-10 py-5 text-lg font-bold text-white dark:text-black overflow-hidden shadow-2xl hover:scale-105 transition-all">
              <span className="relative z-10">Start Free Trial</span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-500 opacity-0 group-hover:opacity-100 dark:from-violet-400 dark:to-pink-400 dark:opacity-0 dark:group-hover:opacity-20 transition-opacity duration-300" />
            </button>
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white/70">
                <Check className="h-4 w-4 text-green-500" /> 14-day free trial
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white/70">
                <Check className="h-4 w-4 text-green-500" /> Cancel anytime
              </div>
            </div>
          </div>
        </Reveal>
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   FOOTER
------------------------------------------------------------------------- */
function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-white/10 py-12 px-6 bg-white dark:bg-black transition-colors duration-500">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">ContelliSense</span>
        </div>
        <div className="text-sm font-medium text-slate-500 dark:text-white/40">
          &copy; {new Date().getFullYear()} ContelliSense AI. All rights reserved.
        </div>
        <div className="flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-white/50">
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Twitter</a>
        </div>
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
      <div className="min-h-screen font-sans selection:bg-violet-500/30">
        <Navbar />
        <main>
          <Hero />
          <Problem />
          <Solution />
          <StorySection />
          <Features />
          <SocialProof />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}