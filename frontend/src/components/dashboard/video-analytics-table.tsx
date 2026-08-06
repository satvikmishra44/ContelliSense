"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ExternalLink } from "lucide-react";
import type { VideoResponse } from "@/lib/api/types";
import { formatNumber, formatPercent, formatDate } from "@/lib/utils";

const MotionTableRow = motion(TableRow);

export function VideoAnalyticsTable({ videos }: { videos: VideoResponse[] }) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filtered = videos.filter((v) =>
    v.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Agentic Search Input */}
      <div
        className={`relative max-w-sm flex items-center gap-2 rounded-full border px-4 h-10 transition-all duration-300 ${
          isFocused
            ? "border-primary/50 bg-primary/5 ring-4 ring-primary/10"
            : "border-border/60 bg-card/30 backdrop-blur-md hover:border-border"
        }`}
      >
        <Search
          className={`h-4 w-4 shrink-0 transition-colors ${
            isFocused ? "text-primary" : "text-muted-foreground/50"
          }`}
        />
        <input
          placeholder="Filter intelligence ledger..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      {/* Intelligence Ledger */}
      <div className="rounded-[1.25rem] border border-border/40 overflow-hidden bg-card/20 backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-4">
                Title / Context
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right py-4">
                Views
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right py-4">
                Likes
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right py-4">
                Engagement
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right py-4">
                Deployed
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 && (
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-12"
                  >
                    <span className="font-mono text-xs">
                      No records match parameters.
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((video, i) => (
                <MotionTableRow
                  key={video.video_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  className="group border-border/20 hover:bg-primary/[0.02] transition-colors"
                >
                  <TableCell className="max-w-[280px]">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {video.title}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-muted-foreground">
                    {formatNumber(video.views)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-muted-foreground">
                    {formatNumber(video.likes)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center rounded-full bg-secondary/50 px-2 py-0.5 text-xs font-medium text-foreground">
                      {formatPercent(video.engagement_rate)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground/60 whitespace-nowrap">
                    {formatDate(video.published_at)}
                  </TableCell>
                </MotionTableRow>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}