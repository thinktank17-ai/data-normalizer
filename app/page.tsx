"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Database,
  GitMerge,
  CheckCircle,
  ArrowRight,
  Upload,
  BarChart3,
  Shield,
} from "lucide-react";

const FEATURES = [
  {
    icon: <Zap className="w-6 h-6 text-violet-400" />,
    title: "Format Standardization",
    desc: "Auto-detect and normalize dates (MM/DD/YYYY → ISO), phone numbers, emails, URLs, names, currency values, and boolean flags.",
  },
  {
    icon: <GitMerge className="w-6 h-6 text-violet-400" />,
    title: "Smart Deduplication",
    desc: "Exact and fuzzy matching eliminates duplicate rows. Levenshtein similarity catches near-duplicates that simple comparison misses.",
  },
  {
    icon: <Database className="w-6 h-6 text-violet-400" />,
    title: "CSV & JSON Support",
    desc: "Drag-and-drop CSV or paste JSON. Get back a clean, normalized file ready for your database or analytics pipeline.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-violet-400" />,
    title: "Change Reports",
    desc: "See exactly what changed, field by field. Full audit trail with before/after values for every normalization applied.",
  },
  {
    icon: <Shield className="w-6 h-6 text-violet-400" />,
    title: "Rule Control",
    desc: "Toggle which normalization rules to apply. Enable only what you need — dates, phones, dedup, null cleanup, and more.",
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-violet-400" />,
    title: "Instant Results",
    desc: "No waiting. Processing happens in real-time. Download your cleaned dataset or export via API.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    per: "forever",
    features: ["500 rows/month", "All normalization rules", "CSV & JSON", "Basic reporting"],
    cta: "Start Free",
    href: "/upload",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    per: "/month",
    features: ["50,000 rows/month", "All normalization rules", "Priority processing", "Full history", "API access"],
    cta: "Start Pro",
    href: "/upload?plan=pro",
    highlight: true,
  },
  {
    name: "Team",
    price: "$79",
    per: "/month",
    features: ["500,000 rows/month", "Everything in Pro", "Team seats", "Webhook export", "Priority support"],
    cta: "Start Team",
    href: "/upload?plan=team",
    highlight: false,
  },
];

export default function Home() {
  const [email, setEmail] = useState("");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">DataNorm AI</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link
            href="/upload"
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
          >
            Try Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-8">
          <Zap className="w-3.5 h-3.5" />
          AI-powered • No code required
        </div>
        <h1 className="text-5xl md:text-6xl font-bold max-w-3xl leading-tight mb-6">
          Clean, normalize &{" "}
          <span className="text-violet-400">deduplicate</span> your data
          <br />
          in seconds
        </h1>
        <p className="text-xl text-white/60 max-w-xl mb-10">
          Upload messy CSV or JSON. DataNorm AI standardizes formats, removes
          duplicates, and returns a clean dataset — instantly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Your Data
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors"
          >
            See How It Works
          </a>
        </div>

        {/* Quick stats */}
        <div className="flex gap-12 mt-16 text-center">
          {[
            ["500K+", "Rows processed"],
            ["12+", "Field types"],
            ["99%", "Accuracy rate"],
          ].map(([num, label]) => (
            <div key={label}>
              <div className="text-3xl font-bold text-violet-400">{num}</div>
              <div className="text-sm text-white/40 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo preview */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-white/40 text-xs ml-2">DataNorm AI — normalization preview</span>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs uppercase tracking-wide">
                  <th className="text-left pb-3 pr-6">Field</th>
                  <th className="text-left pb-3 pr-6">Original</th>
                  <th className="text-left pb-3 pr-6">Normalized</th>
                  <th className="text-left pb-3">Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["date_created", "03/15/2024", "2024-03-15", "dates"],
                  ["phone", "5551234567", "(555) 123-4567", "phones"],
                  ["email", "JOHN@EXAMPLE.COM", "john@example.com", "emails"],
                  ["name", "john smith", "John Smith", "names"],
                  ["price", "$1,299.00", "1299.00", "currency"],
                  ["active", "yes", "true", "booleans"],
                  ["website", "example.com", "https://example.com", "urls"],
                ].map(([field, original, normalized, rule]) => (
                  <tr key={field}>
                    <td className="py-2.5 pr-6 text-white/60 font-mono text-xs">{field}</td>
                    <td className="py-2.5 pr-6 text-red-400 font-mono text-xs">{original}</td>
                    <td className="py-2.5 pr-6 text-green-400 font-mono text-xs">{normalized}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded text-xs">
                        {rule}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-4xl font-bold text-center mb-4">
          Everything your data needs
        </h2>
        <p className="text-white/50 text-center mb-16 max-w-xl mx-auto">
          From dates to phone numbers to duplicates — DataNorm AI handles the
          full normalization pipeline automatically.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-4xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-white/50 text-center mb-16">
          Start free. Scale when you need it.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl border ${
                plan.highlight
                  ? "border-violet-500 bg-violet-600/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-4">
                  Most Popular
                </div>
              )}
              <div className="text-2xl font-bold mb-1">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-white/40 text-sm">{plan.per}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-violet-600 hover:bg-violet-700 text-white"
                    : "border border-white/20 hover:border-white/40 text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-32 text-center">
        <div className="p-12 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30">
          <h2 className="text-4xl font-bold mb-4">Ready to clean your data?</h2>
          <p className="text-white/60 mb-8">
            No signup required. Upload a file and get normalized data back in seconds.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Your Data Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm">
        © 2026 DataNorm AI. All rights reserved.
      </footer>
    </div>
  );
}
