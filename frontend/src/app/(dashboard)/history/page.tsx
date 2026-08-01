import { HistoryList } from "@/components/dashboard/history-list";

export default function HistoryPage() {
  return (
    <div>
      <h1 className="text-xl font-display font-semibold mb-6">Analysis history</h1>
      <HistoryList />
    </div>
  );
}