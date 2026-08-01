"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { VideoResponse } from "@/lib/api/types";
import { formatNumber, formatPercent, formatDate } from "@/lib/utils";

export function VideoAnalyticsTable({ videos }: { videos: VideoResponse[] }) {
  const [query, setQuery] = useState("");

  const filtered = videos.filter((v) =>
    v.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <Input
        placeholder="Filter videos by title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm mb-4"
      />
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Likes</TableHead>
              <TableHead className="text-right">Engagement</TableHead>
              <TableHead className="text-right">Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No videos match your filter.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((video) => (
              <TableRow key={video.video_id}>
                <TableCell className="max-w-xs truncate">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                  >
                    {video.title}
                  </a>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(video.views)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(video.likes)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(video.engagement_rate)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatDate(video.published_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}