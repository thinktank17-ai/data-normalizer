"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  Database,
  X,
  FileText,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Papa from "papaparse";
import type { NormRule } from "@/lib/normalizer";

const RULES: { id: NormRule; label: string; desc: string }[] = [
  { id: "dates", label: "Dates", desc: "ISO 8601 standardization" },
  { id: "phones", label: "Phone Numbers", desc: "(XXX) XXX-XXXX format" },
  { id: "emails", label: "Emails", desc: "Lowercase & validate" },
  { id: "names", label: "Names", desc: "Title case" },
  { id: "urls", label: "URLs", desc: "Add https:// prefix" },
  { id: "currency", label: "Currency", desc: "Strip symbols, 2 decimals" },
  { id: "booleans", label: "Booleans", desc: "yes/no → true/false" },
  { id: "nulls", label: "Null Cleanup", desc: 'Replace "N/A", "none"' },
  { id: "dedup", label: "Deduplication", desc: "Exact + fuzzy matching" },
];

export default function UploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  const [selectedRules, setSelectedRules] = useState<Set<NormRule>>(
    new Set(["dates", "phones", "emails", "names", "nulls", "dedup"])
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const parseFile = useCallback((f: File) => {
    setFile(f);
    setError(null);

    if (f.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const arr = Array.isArray(json) ? json : [json];
          setRawData(arr);
          setPreview(arr.slice(0, 5));
        } catch {
          setError("Invalid JSON file");
        }
      };
      reader.readAsText(f);
    } else {
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as Record<string, unknown>[];
          setRawData(data);
          setPreview(data.slice(0, 5));
        },
        error: () => setError("Failed to parse CSV"),
      });
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) parseFile(f);
    },
    [parseFile]
  );

  const toggleRule = (rule: NormRule) => {
    setSelectedRules((prev) => {
      const next = new Set(prev);
      if (next.has(rule)) next.delete(rule);
      else next.add(rule);
      return next;
    });
  };

  const handleNormalize = async () => {
    if (rawData.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: rawData,
          rules: Array.from(selectedRules),
          jobName: file?.name ?? "Pasted data",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Normalization failed");
        return;
      }

      // Store results and redirect
      sessionStorage.setItem("normResult", JSON.stringify(json));
      router.push(`/results/${json.jobId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fields = preview.length > 0 ? Object.keys(preview[0]) : [];

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
        <span className="text-white/40 text-sm">Upload & Normalize</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Upload Your Data</h1>
        <p className="text-white/50 mb-10">
          CSV or JSON — we&apos;ll detect field types and normalize automatically.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: File upload */}
          <div className="space-y-6">
            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-violet-400 bg-violet-500/10"
                  : "border-white/20 hover:border-violet-500/50 hover:bg-white/5"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
              />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-white/40 text-sm mt-1">
                      {rawData.length} rows · {fields.length} fields
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setRawData([]); setPreview([]); }}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-white/40" />
                  </div>
                  <div>
                    <div className="font-medium text-lg">Drop your file here</div>
                    <div className="text-white/40 text-sm mt-1">CSV or JSON · up to 10MB</div>
                  </div>
                  <div className="px-4 py-1.5 bg-violet-600/20 text-violet-300 rounded-lg text-sm">
                    Browse files
                  </div>
                </div>
              )}
            </div>

            {/* Preview table */}
            {preview.length > 0 && (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-2 bg-white/5 text-xs text-white/40 uppercase tracking-wide">
                  Preview — first {preview.length} rows
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        {fields.slice(0, 6).map((f) => (
                          <th key={f} className="px-3 py-2 text-left text-white/50 font-medium">
                            {f}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                          {fields.slice(0, 6).map((f) => (
                            <td key={f} className="px-3 py-2 text-white/60 truncate max-w-[100px]">
                              {String(row[f] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right: Rules */}
          <div className="space-y-6">
            <div>
              <h2 className="font-semibold text-lg mb-1">Normalization Rules</h2>
              <p className="text-white/40 text-sm mb-4">
                Toggle which rules to apply. Auto-detected fields are highlighted.
              </p>
              <div className="space-y-2">
                {RULES.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => toggleRule(rule.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-colors text-left ${
                      selectedRules.has(rule.id)
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/8"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedRules.has(rule.id)
                            ? "bg-violet-600"
                            : "border border-white/20"
                        }`}
                      >
                        {selectedRules.has(rule.id) && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{rule.label}</div>
                        <div className="text-white/40 text-xs">{rule.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleNormalize}
              disabled={rawData.length === 0 || loading || selectedRules.size === 0}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Normalizing...
                </>
              ) : (
                <>
                  Normalize {rawData.length > 0 ? `${rawData.length} rows` : "Data"}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            {rawData.length === 0 && (
              <p className="text-center text-white/30 text-sm">
                Upload a file to get started
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
