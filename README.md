# DataNorm AI — AI-Powered Data Normalization

> Upload messy CSV or JSON. Get back clean, standardized, deduplicated data in seconds.

**Live:** https://data-normalizer.vercel.app  
**GitHub:** https://github.com/thinktank17-ai/data-normalizer

---

## What It Does

DataNorm AI normalizes raw datasets with zero code:

| Feature | Detail |
|---|---|
| **Format Standardization** | Dates → ISO 8601, phones → (XXX) XXX-XXXX, emails → lowercase, URLs → https://, currency → 2 decimals, booleans → true/false |
| **Deduplication** | Exact match + fuzzy Levenshtein similarity (85% threshold) |
| **Null Cleanup** | Replaces "N/A", "none", "null", "-", "" with actual null |
| **Change Audit** | Full field-by-field before/after report |
| **Export** | Download normalized CSV or JSON |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Database:** SQLite (local) / Turso (production)
- **ORM:** Prisma 7 + libsql adapter
- **Payments:** Stripe (ready to wire)
- **Deployment:** Vercel

## Revenue Model

| Plan | Price | Rows/Month |
|---|---|---|
| Free | $0 | 500 |
| Pro | $29/mo | 50,000 |
| Team | $79/mo | 500,000 |

## Local Development

```bash
npm install
cp .env.example .env   # set DATABASE_URL=file:./prisma/dev.db
npx prisma migrate dev
npm run dev
```

## Normalization Rules

The core engine (`lib/normalizer.ts`) auto-detects field types using:
1. **Name-based inference** — field names containing "date", "phone", "email", etc.
2. **Value-based inference** — pattern matching on sample data
3. **Manual override** — users can toggle individual rules

## API

```bash
POST /api/normalize
Content-Type: application/json

{
  "data": [{"name": "john smith", "email": "JOHN@EXAMPLE.COM", "date": "03/15/2024"}],
  "rules": ["names", "emails", "dates", "dedup", "nulls"],
  "jobName": "My Dataset"
}
```

Returns normalized rows with `changes` array showing exactly what was modified.
