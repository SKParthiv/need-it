# AGENTS.md — rules for any AI (or human) writing code in this repo

These rules exist because this repo is public and is built with AI
assistance. Breaking them leaks real people's data or breaks the product
contract. Read this file BEFORE writing any code.

## 1. Never commit personal information — this is a PUBLIC repo

- **No real credentials, ever.** No passwords, API keys, tokens, or
  secrets in source, tests, seed scripts, docs, PR bodies, issues, or
  commit messages. Secrets live in `.env` (gitignored) or Render/GitHub
  env vars. `.env.example` files get BLANK values only.
- **No real personal data.** No real email addresses (roll-number emails
  included), phone numbers, UPI IDs, room numbers, or full names in code,
  seeds, fixtures, or docs. Use fictional placeholders:
  `student1@example.com`, `TestPass123!` (dev-only seeds), "Hostel Block X".
- **No seed accounts, period.** Sign-in is real SASTRA Google Workspace
  only; there is no demo-user mechanism in the app. Backend tests create
  their own throwaway users inside the test DB. Never reintroduce a seed
  script with shared credentials.
- **If a secret or personal detail was already committed:** rotating the
  secret is the only real fix — deleting the line does NOT remove it from
  git history. Tell the maintainer immediately.

## 2. Never build auth bypasses

- No hardcoded login fast-paths, "developer accounts", backdoor emails,
  or client-side-only admin checks. Auth is decided by the backend
  (`/api/auth/`, Google OAuth). The frontend renders what the server
  says — it never grants access by itself.
- Admin actions live in Django `/admin/`. Do NOT build a custom admin
  frontend (userflow-v2 §8).

## 3. The docs are the contract — read them first

- `docs/userflow-v2.md` — **the master contract** (actors, auth, order
  spine, payment card payload, trust, do-NOT-build list).
- `docs/state-machine.md` — order + payment states; the server owns them.
- `docs/decisions.md` — why things are the way they are (D1–D11). If you
  change a decision, update the register in the same PR.
- `docs/api-reference.md` — endpoint table.
- If code and docs disagree, the **deployed backend** is truth — then fix
  the doc in the same PR.

## 4. PR discipline

- One feature per PR. A PR that mixes auth + AI + admin panels + UI
  rewrites is unreviewable and will be closed, not merged.
- Every PR must keep `python manage.py test` green (backend) and
  `npx tsc --noEmit` clean (web).
- Never paste credentials or personal info into a PR body or issue.
- Don't touch CI workflows, deploy config (`render.yaml`), or `.env*`
  examples to make a feature "work" — ask in the PR instead.

## 5. Pilot scope (what NOT to build)

The do-not-build list in userflow-v2 §8 is law: no commission/gateway UI,
no custom admin frontend, no shops module, no COD. Money mode (D9):
merchant of record via Razorpay payment links (`PAYMENT_PROVIDER` env;
`manual` direct-UPI is the demo fallback); true splits (Route) are
deferred per D4. New external services (another console, another quota)
need a decisions.md entry FIRST — the pilot runs on Django + Postgres +
Cloudinary + Google OAuth + Razorpay (base account) and nothing else
without a founder decision.
