"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  Download,
  ChevronLeft,
  CheckCircle2,
  Copy,
  GitMerge,
  BarChart3,
  FileDown,
} from "lucide-react";

interface NormChange {
  field: string;
  from: string | null;
  to: string | null;
  rule: string;
}

interface NormRowResult {
  rowIndex: number;
  original: Record<string, unknown>;
  normalized: Record<string, unknown>;
  changes: NormChange[];
  isDuplicate: boolean;
}

interface NormResponse {
  jobId: string;
  totalRows: number;
  dupRows: number;
  changesCount: number;
  fieldStats: Record<string, number>;
  results: NormRowResult[];
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<NormResponse | null>(null);
  const [tab, setTab] = useState<"normalized" | "changes" | "dupes">("normalized");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Try sessionStorage first (faster)
    const cached = sessionStorage.getItem("normResult");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setData(parsed);
        return;
      } catch {
        // fall through to fetch
      }
    }

    // Fetch from API
    params.then(({ id }) => {
      fetch(`/api/jobs/${id}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.job) {
            // Transform DB format to response format
            const results = json.job.results.map((r: {
              rowIndex: number;
              original: string;
              normalized: string;
              changes: string;
              isDuplicate: boolean;
            }) => ({
              rowIndex: r.rowIndex,
              original: JSON.parse(r.original),
              normalized: JSON.parse(r.normalized),
              changes: JSON.parse(r.changes),
              isDuplicate: r.isDuplicate,
            }));
            setData({
              jobId: json.job.id,
              totalRows: json.job.rowCount,
              dupRows: json.job.dupCount,
              changesCount: results.reduce((a: number, r: NormRowResult) => a + r.changes.length, 0),
              fieldStats: {},
              results,
            });
          }
        });
    });
  }, [params]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40">Loading results...</div>
      </div>
    );
  }

  const cleanRows = data.results.filter((r) => !r.isDuplicate);
  const dupeRows = data.results.filter((r) => r.isDuplicate);
  const changedRows = data.results.filter((r) => r.changes.length > 0 && !r.isDuplicate);

  const fields = data.results.length > 0 ? Object.keys(data.results[0].normalized) : [];

  const downloadJSON = () => {
    const clean = cleanRows.map((r) => r.normalized);
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `normalized-${data.jobId}.json`;
    a.click();
  };

  const downloadCSV = () => {
    const clean = cleanRows.map((r) => r.normalized);
    if (clean.length === 0) return;
    const headers = Object.keys(clean[0]);
    const rows = clean.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `normalized-${data.jobId}.csv`;
    a.click();
  };

  const copyJSON = () => {
    const clean = cleanRows.map((r) => r.normalized);
    navigator.clipboard.writeText(JSON.stringify(clean, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">DataNorm AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={copyJSON}
            className="flex items-center gap-2 border border-white/20 hover:border-white/40 px-4 py-1.5 rounded-lg text-sm transition-colors"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy JSON"}
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 border border-white/20 hover:border-white/40 px-4 py-1.5 rounded-lg text-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={downloadJSON}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-4 py-1.5 rounded-lg text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <Link href="/upload" className="flex items-center gap-1 text-white/40 hover:text-white/60 text-sm mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Upload another file
        </Link>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Rows", value: data.totalRows, color: "text-white" },
            {
              label: "Clean Rows",
              value: cleanRows.length,
              color: "text-green-400",
            },
            {
              label: "Duplicates Removed",
              value: data.dupRows,
              color: "text-yellow-400",
              icon: <GitMerge className="w-4 h-4" />,
            },
            {
              label: "Fields Normalized",
              value: data.changesCount,
              color: "text-violet-400",
              icon: <BarChart3 className="w-4 h-4" />,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-2xl border border-white/10 bg-white/5"
            >
              <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wide mb-2">
                {stat.icon}
                {stat.label}
              </div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Field stats */}
        {Object.keys(data.fieldStats).length > 0 && (
          <div className="mb-8 p-5 rounded-2xl border border-white/10 bg-white/5">
            <h3 className="font-semibold mb-4 text-sm text-white/60 uppercase tracking-wide">
              Changes by Field
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.fieldStats).map(([field, count]) => (
                <div
                  key={field}
                  className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-sm"
                >
                  <span className="text-white/70">{field}</span>
                  <span className="ml-2 text-violet-400 font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
          {(["normalized", "changes", "dupes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? "bg-violet-600 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {t === "normalized" && `Clean Data (${cleanRows.length})`}
              {t === "changes" && `Changes (${changedRows.length})`}
              {t === "dupes" && `Duplicates (${dupeRows.length})`}
            </button>
          ))}
        </div>

        {/* Data table */}
        {tab === "normalized" && (
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#0a0f1e] border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-white/40 text-xs font-medium w-12">#</th>
                    {fields.slice(0, 10).map((f) => (
                      <th key={f} className="px-4 py-3 text-left text-white/40 text-xs font-medium">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cleanRows.slice(0, 500).map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2.5 text-white/30 text-xs">{row.rowIndex + 1}</td>
                      {fields.slice(0, 10).map((f) => {
                        const changed = row.changes.some((c) => c.field === f);
                        return (
                          <td
                            key={f}
                            className={`px-4 py-2.5 truncate max-w-[150px] text-xs ${
                              changed ? "text-green-400" : "text-white/60"
                            }`}
                          >
                            {String(row.normalized[f] ?? "")}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "changes" && (
          <div className="space-y-3">
            {changedRows.slice(0, 200).map((row) => (
              <div key={row.rowIndex} className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="text-xs text-white/30 mb-3">Row {row.rowIndex + 1}</div>
                <div className="space-y-2">
                  {row.changes.map((change, ci) => (
                    <div key={ci} className="flex items-center gap-3 text-sm">
                      <span className="text-white/50 font-mono text-xs w-32 flex-shrink-0">
                        {change.field}
                      </span>
                      <span className="text-red-400 line-through text-xs truncate max-w-[200px]">
                        {change.from ?? "null"}
                      </span>
                      <span className="text-white/30">→</span>
                      <span className="text-green-400 text-xs truncate max-w-[200px]">
                        {change.to ?? "null"}
                      </span>
                      <span className="ml-auto px-2 py-0.5 bg-violet-500/10 text-violet-300 rounded text-xs flex-shrink-0">
                        {change.rule}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {changedRows.length === 0 && (
              <div className="text-center text-white/30 py-16">
                No changes made — data was already clean!
              </div>
            )}
          </div>
        )}

        {tab === "dupes" && (
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            {dupeRows.length === 0 ? (
              <div className="text-center text-white/30 py-16">
                No duplicates found 🎉
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#0a0f1e] border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-white/40 text-xs font-medium w-12">#</th>
                      {fields.slice(0, 8).map((f) => (
                        <th key={f} className="px-4 py-3 text-left text-white/40 text-xs font-medium">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dupeRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 bg-yellow-500/5">
                        <td className="px-4 py-2.5 text-yellow-400/50 text-xs">{row.rowIndex + 1}</td>
                        {fields.slice(0, 8).map((f) => (
                          <td key={f} className="px-4 py-2.5 text-yellow-200/40 truncate max-w-[150px] text-xs">
                            {String(row.original[f] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
