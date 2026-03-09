/**
 * Core AI-Powered Data Normalization Engine
 * Handles: format standardization, deduplication, type inference, cleaning
 */

export type NormRule =
  | "dates"
  | "phones"
  | "emails"
  | "addresses"
  | "names"
  | "urls"
  | "currency"
  | "booleans"
  | "nulls"
  | "dedup";

export interface NormChange {
  field: string;
  from: string | null;
  to: string | null;
  rule: NormRule;
}

export interface NormRowResult {
  rowIndex: number;
  original: Record<string, unknown>;
  normalized: Record<string, unknown>;
  changes: NormChange[];
  isDuplicate: boolean;
}

export interface NormSummary {
  totalRows: number;
  dupRows: number;
  changesCount: number;
  fieldStats: Record<string, number>; // field -> change count
  results: NormRowResult[];
}

// ─── Format Standardizers ────────────────────────────────────────────────────

function normalizeDate(val: string): string | null {
  if (!val || typeof val !== "string") return null;
  const s = val.trim();
  if (!s) return null;

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;

  // MM/DD/YYYY or MM-DD-YYYY
  const mdy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // DD/MM/YYYY (European) - heuristic: if month > 12 assume DD/MM
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Try native Date parse as last resort
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return s; // can't normalize, return as-is
}

function normalizePhone(val: string): string | null {
  if (!val || typeof val !== "string") return null;
  const digits = val.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return val; // international or unknown format, leave
}

function normalizeEmail(val: string): string | null {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return trimmed;
  return val; // invalid email, leave as-is
}

function normalizeName(val: string): string | null {
  if (!val || typeof val !== "string") return null;
  return val
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeUrl(val: string): string | null {
  if (!val || typeof val !== "string") return null;
  const s = val.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return `https://${s}`;
  return s.toLowerCase();
}

function normalizeCurrency(val: string): string | null {
  if (!val || typeof val !== "string") return null;
  const num = parseFloat(val.replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return val;
  return num.toFixed(2);
}

function normalizeBoolean(val: string): string | null {
  if (!val || typeof val !== "string") return null;
  const lower = val.trim().toLowerCase();
  if (["yes", "y", "true", "1", "on"].includes(lower)) return "true";
  if (["no", "n", "false", "0", "off"].includes(lower)) return "false";
  return val;
}

function normalizeNull(val: unknown): null | unknown {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    const lower = val.trim().toLowerCase();
    if (["null", "none", "n/a", "na", "-", "", "undefined"].includes(lower)) return null;
  }
  return val;
}

// ─── Field Type Inference ─────────────────────────────────────────────────────

function inferFieldType(
  fieldName: string,
  samples: string[]
): NormRule | null {
  const name = fieldName.toLowerCase();

  // Name-based inference
  if (/\b(date|dob|born|created|updated|timestamp|time)\b/.test(name)) return "dates";
  if (/\b(phone|mobile|cell|fax|tel)\b/.test(name)) return "phones";
  if (/\b(email|e-mail|mail)\b/.test(name)) return "emails";
  if (/\b(address|addr|street|city|zip|postal)\b/.test(name)) return "addresses";
  if (/\b(name|first|last|full|fname|lname)\b/.test(name)) return "names";
  if (/\b(url|link|href|website|site)\b/.test(name)) return "urls";
  if (/\b(price|cost|amount|total|revenue|salary|usd|aud|gbp)\b/.test(name)) return "currency";
  if (/\b(active|enabled|verified|flag|bool|is_|has_)\b/.test(name)) return "booleans";

  // Value-based inference from samples
  const nonNull = samples.filter(Boolean).slice(0, 10);
  if (nonNull.length === 0) return null;

  // Date patterns
  if (nonNull.every((v) => /\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(v))) return "dates";
  // Phone patterns
  if (nonNull.every((v) => /[\d\s\-\(\)\+]{7,}/.test(v.replace(/\D/g, "").length > 0 ? v : "x"))) {
    if (nonNull.every((v) => v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15)) return "phones";
  }
  // Email patterns
  if (nonNull.every((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))) return "emails";
  // URL patterns
  if (nonNull.some((v) => /^https?:\/\//i.test(v.trim()))) return "urls";

  return null;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function rowFingerprint(row: Record<string, unknown>): string {
  // Create a normalized fingerprint for duplicate detection
  return Object.values(row)
    .map((v) => String(v ?? "").toLowerCase().trim().replace(/\s+/g, " "))
    .join("|");
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function isFuzzyDuplicate(fp1: string, fp2: string, threshold = 0.85): boolean {
  if (fp1 === fp2) return true;
  const maxLen = Math.max(fp1.length, fp2.length);
  if (maxLen === 0) return true;
  const dist = levenshtein(fp1, fp2);
  return (1 - dist / maxLen) >= threshold;
}

// ─── Main Normalize Function ──────────────────────────────────────────────────

export function normalizeDataset(
  rows: Record<string, unknown>[],
  requestedRules: NormRule[]
): NormSummary {
  if (rows.length === 0) {
    return { totalRows: 0, dupRows: 0, changesCount: 0, fieldStats: {}, results: [] };
  }

  const fields = Object.keys(rows[0]);

  // Infer field types from data
  const fieldRules: Record<string, NormRule | null> = {};
  for (const field of fields) {
    const samples = rows.slice(0, 20).map((r) => String(r[field] ?? ""));
    fieldRules[field] = inferFieldType(field, samples);
  }

  const results: NormRowResult[] = [];
  const fingerprints: string[] = [];
  let dupCount = 0;
  let totalChanges = 0;
  const fieldStats: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const original = { ...rows[i] };
    const normalized: Record<string, unknown> = { ...rows[i] };
    const changes: NormChange[] = [];

    for (const field of fields) {
      let val = normalized[field];

      // Always try null normalization
      if (requestedRules.includes("nulls")) {
        const cleaned = normalizeNull(val);
        if (cleaned !== val) {
          changes.push({ field, from: String(val), to: String(cleaned), rule: "nulls" });
          normalized[field] = cleaned;
          val = cleaned;
        }
      }

      if (val === null || val === undefined) continue;
      const strVal = String(val);

      const rule = fieldRules[field];
      if (!rule || !requestedRules.includes(rule)) continue;

      let newVal: string | null = strVal;

      switch (rule) {
        case "dates": newVal = normalizeDate(strVal); break;
        case "phones": newVal = normalizePhone(strVal); break;
        case "emails": newVal = normalizeEmail(strVal); break;
        case "names": newVal = normalizeName(strVal); break;
        case "urls": newVal = normalizeUrl(strVal); break;
        case "currency": newVal = normalizeCurrency(strVal); break;
        case "booleans": newVal = normalizeBoolean(strVal); break;
      }

      if (newVal !== strVal && newVal !== null) {
        changes.push({ field, from: strVal, to: newVal, rule });
        normalized[field] = newVal;
        fieldStats[field] = (fieldStats[field] ?? 0) + 1;
        totalChanges++;
      }
    }

    // Deduplication
    let isDuplicate = false;
    if (requestedRules.includes("dedup")) {
      const fp = rowFingerprint(normalized as Record<string, unknown>);
      // Exact dedup
      const exactMatch = fingerprints.findIndex((f) => f === fp);
      if (exactMatch !== -1) {
        isDuplicate = true;
        dupCount++;
      } else {
        // Fuzzy dedup (only check recent 1000 for performance)
        const recentFps = fingerprints.slice(-1000);
        const fuzzyMatch = recentFps.find((f) => isFuzzyDuplicate(fp, f));
        if (fuzzyMatch) {
          isDuplicate = true;
          dupCount++;
        }
      }
      if (!isDuplicate) fingerprints.push(fp);
    }

    results.push({
      rowIndex: i,
      original,
      normalized,
      changes,
      isDuplicate,
    });
  }

  return {
    totalRows: rows.length,
    dupRows: dupCount,
    changesCount: totalChanges,
    fieldStats,
    results,
  };
}

// ─── Plan Limits ──────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<string, number> = {
  free: 500,
  pro: 50_000,
  team: 500_000,
};

export const PLAN_PRICES: Record<string, { monthly: number; priceId: string }> = {
  pro: { monthly: 29, priceId: "price_pro_monthly" },
  team: { monthly: 79, priceId: "price_team_monthly" },
};
