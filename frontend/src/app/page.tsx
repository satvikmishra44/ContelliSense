import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-label="Contellisense logo">
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" stroke="currentColor" strokeWidth="1.6" className="text-primary" />
            <circle cx="12" cy="12" r="3" fill="currentColor" className="text-primary" />
          </svg>
          Contellisense
        </div>
        <Link href="/dashboard">
          <Button variant="default" size="sm">
            Launch app <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-2xl md:text-3xl font-display font-semibold leading-tight tracking-tight">
          Know exactly what your next YouTube video should be.
        </h1>
        <p className="mt-5 text-base text-muted-foreground max-w-2xl mx-auto">
          Contellisense studies your channel's real upload patterns, cross-references
          live search trends in your niche, and hands you ranked, ready-to-shoot video
          ideas — with hooks, thumbnails, and virality scores included.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button size="lg">Analyze your channel</Button>
          </Link>
          <Button size="lg" variant="outline">
            See how it works
          </Button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="mt-4 font-display text-lg font-medium">Niche-aware AI</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Learns your exact content style from your last 100 uploads before
            suggesting a single idea.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm md:mt-6">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="mt-4 font-display text-lg font-medium">Live trend signals</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Multi-keyword Google Trends momentum and velocity, mapped directly to
            your niche vocabulary.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <h3 className="mt-4 font-display text-lg font-medium">Exportable reports</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            One-click Excel export with channel stats, video analytics, and full
            recommendation breakdowns.
          </p>
        </div>
      </section>
    </main>
  );
}