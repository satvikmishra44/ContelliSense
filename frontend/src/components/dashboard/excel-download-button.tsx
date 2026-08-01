"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { getExcelDownloadUrl } from "@/lib/api/analysis";
import { toast } from "sonner";

export function ExcelDownloadButton({ uuid }: { uuid: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(getExcelDownloadUrl(uuid));
      if (!res.ok) throw new Error("Report is not ready yet");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contellisense-report-${uuid}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Report downloaded");
    } catch (error) {
      toast.error("Download failed", {
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={loading} variant="outline" className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Download Excel report
    </Button>
  );
}