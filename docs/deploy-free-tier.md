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
2. Fill the env vars it asks for:
   - `DJANGO_SECRET_KEY` — generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"`
   - `DJANGO_ALLOWED_HOSTS` — `needit-api.onrender.com` (your actual Render domain)
   - `CSRF_TRUSTED_ORIGINS` — `https://needit-api.onrender.com` (needed for /admin/ login)
   - `CORS_ALLOWED_ORIGINS` — `http://localhost:3000` for now; add the Pages URL in step 3
   - `PUBLIC_API_BASE_URL` — `https://needit-api.onrender.com` (goes into verification emails)
   - `POSTGRES_HOST` / `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` — from step 1
   - `ADMIN_EMAIL` + `ADMIN_PASSWORD` — your superuser. The deploy creates it
     automatically (`ensure_admin`). **Remove both vars after the first deploy.**
   - `BREVO_API_KEY` + `DEFAULT_FROM_EMAIL` — optional but recommended: real
     verification emails. NOTE: Render's free tier blocks outbound SMTP
     (ports 25/465/587), so Gmail SMTP does NOT work there — the code uses
     Brevo's HTTP API instead (free 300 emails/day, no card):
     brevo.com → sign up → Settings → SMTP & API → API Keys → create key.
     `DEFAULT_FROM_EMAIL` must be a sender you verify in Brevo (your Gmail
     address works: Senders → add → click the confirmation email).
     Without these, register returns the token in the API response
     (pilot mode — works, but proves nothing).
3. Deploy. Visit `https://<your-domain>/api/health/` → JSON health status
   (`db: "ok"` confirms the Neon connection). Log into
   `https://<your-domain>/admin/` with the admin creds.

## 2b. The pipeline (2 min, one time)

Deploys do NOT happen on push directly. The pipeline is:
**push to main → Backend CI green → GitHub Actions triggers the Render deploy hook.**

1. Render → your service → Settings → Build & Deploy → copy the **Deploy Hook** URL.
2. GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
   name `RENDER_DEPLOY_HOOK_URL`, value = the hook URL.
3. Done. Red CI = no deploy. Green CI = production updates itself.

## 3. Web app — Cloudflare Pages (10 min, optional for pilot)

1. pages.dev → sign in with GitHub → Create project → pick `need-it`.
2. Build settings: root directory `web`, build command `npm run build`,
   output directory `dist`.
3. Env var: `VITE_API_URL=https://<your-render-domain>` (no trailing slash).
4. Back on Render: add the Pages URL to `CORS_ALLOWED_ORIGINS`
   (e.g. `http://localhost:3000,https://needit.pages.dev`).

## 4. CI/CD — already done

`backend-ci.yml` runs backend tests in production config on every backend
change; `ci.yml` builds the web app; `deploy.yml` triggers the Render deploy
hook only after Backend CI passes on main (see 2b). Free on a public repo.

## 5. What we deliberately did NOT set up

- **Celery + Redis** — the payment-timeout auto-release runs as a lazy sweep on
  every feed read (`sweep_stale_accepted`). At pilot scale a worker + broker is
  dead weight. Revisit when Razorpay webhooks make timing critical.

## 6. Capacity reality (100–200 users, spike to 1000)

- **Render free web** (512 MB, shared CPU): comfortable for a few thousand
  requests/day — that IS 200 users of a campus errand app. It sleeps after
  15 min idle; with real usage it stays warm during the day.
- **Neon free** (0.5 GB): thousands of orders fit easily. Photos are URLs only.
- **Brevo free**: 300 emails/day — onboarding 200 users = 200 emails. Fits (spread big launch days, or resend next morning).
- **At ~1000 users**: you said money exists by then — first upgrades are
  Render Starter ($7/mo, no sleep, more CPU) and Neon Launch ($19/mo). The
  architecture doesn't change, only the plan sizes.
- **Razorpay Route** — KYC paperwork is weeks; `ManualUPIProvider` runs the
  pilot. Start the KYC *now* in parallel — it's the long pole, not code.
- **Branch protection** — parked until there's something deployed to protect.

## 7. Demo-day checklist

- [ ] Open the API URL once (wake it from sleep) 5 min before the demo
- [ ] Seed accounts exist (run seed locally against Neon ONLY with ALLOW_SEED — better: register fresh accounts through the app)
- [ ] Phone and laptop on the same network if demoing LAN, or use the deployed URLs
