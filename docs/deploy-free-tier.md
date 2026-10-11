# Deploy — free tier, ~30 minutes, no credit card

The stack: **Render** (API) + **Neon** (Postgres) + **Cloudflare Pages** (web).
All three sign in with GitHub. Total cost: ₹0. Photos go to Cloudflare R2 when
chat photos ship (free 10 GB) — not needed yet.

Tradeoffs, honestly: Render's free API **sleeps after ~15 min idle** — first
request after a lull takes 30–60 s. Fine for a campus pilot; keep the URL warm
before demos by opening it once. If that ever becomes unacceptable, the Oracle
Cloud "Always Free" VM (4 ARM cores, no sleep) running our Docker Compose is
the upgrade path — it needs real VM admin, so don't start there.

## 1. Database — Neon (5 min)

1. neon.tech → sign up with GitHub → New Project (`needit`, region closest to you).
2. Dashboard → Connection Details. Note: **host, database, user, password**.
3. Free tier = 0.5 GB. Our rules keep it alive: photos are URLs only, and old
   notifications/audit rows get pruned.

## 2. API — Render (10 min)

1. render.com → sign up with GitHub → **New → Blueprint** → pick `need-it`.
   Render reads `render.yaml` from the repo root and creates `needit-api`.
2. Fill the 8 env vars it asks for:
   - `DJANGO_SECRET_KEY` — generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"`
   - `DJANGO_ALLOWED_HOSTS` — `needit-api.onrender.com` (your actual Render domain)
   - `CORS_ALLOWED_ORIGINS` — leave `http://localhost:3000` for now; add the Pages URL in step 3
   - `POSTGRES_HOST` / `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` — from step 1
3. Deploy. Build runs migrations automatically. Visit `https://<your-domain>/`
   — you should see the JSON status view.
4. **Every push to `main` auto-deploys from now on.** That is the workflow.

## 3. Web app — Cloudflare Pages (10 min, optional for pilot)

1. pages.dev → sign in with GitHub → Create project → pick `need-it`.
2. Build settings: root directory `web`, build command `npm run build`,
   output directory `dist`.
3. Env var: `VITE_API_URL=https://<your-render-domain>` (no trailing slash).
4. Back on Render: add the Pages URL to `CORS_ALLOWED_ORIGINS`
   (e.g. `http://localhost:3000,https://needit.pages.dev`).

## 4. CI — already done

`.github/workflows/ci.yml` runs on every PR and push to main: backend tests
(35) + web type-check + web build. Red check = don't merge. Free on a public repo.

## 5. What we deliberately did NOT set up

- **Celery + Redis** — the payment-timeout auto-release runs as a lazy sweep on
  every feed read (`sweep_stale_accepted`). At pilot scale a worker + broker is
  dead weight. Revisit when Razorpay webhooks make timing critical.
- **Razorpay Route** — KYC paperwork is weeks; `ManualUPIProvider` runs the
  pilot. Start the KYC *now* in parallel — it's the long pole, not code.
- **Branch protection** — parked until there's something deployed to protect.

## 6. Demo-day checklist

- [ ] Open the API URL once (wake it from sleep) 5 min before the demo
- [ ] Seed accounts exist (run seed locally against Neon ONLY with ALLOW_SEED — better: register fresh accounts through the app)
- [ ] Phone and laptop on the same network if demoing LAN, or use the deployed URLs
