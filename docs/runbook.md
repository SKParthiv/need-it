# Runbook — deploy once, then run it

One file for production: first-deploy checklist, every deploy after, recurring
jobs, limits, and incidents. Historical long-forms live in git history.

## First deploy (one time, ~30 min of clicking)

1. **Neon** (neon.tech, GitHub login) → project `needit`, Singapore region.
   Note host / db / user / password. Free tier = 0.5 GB.
2. **Render** (render.com, GitHub login) → New → Blueprint → this repo.
   Set the env vars below, deploy, then hit `/api/health/` for
   `{"status":"ok"}`.
3. **Remove `ADMIN_EMAIL` / `ADMIN_PASSWORD`** from Render after the superuser
   is confirmed at `/admin/`.
4. **GitHub repo secret** `RENDER_DEPLOY_HOOK_URL` = Render service → Settings
   → Deploy Hook. From then on, push → green Backend CI → auto-deploy.
5. **Cloudflare Pages** → Workers & Pages → Create → Pages → Connect to Git →
   repo, root `web`, framework Vite, build `npm run build`, output `dist`.
   Set the three `VITE_*` vars below, then add the Pages URL to
   `CORS_ALLOWED_ORIGINS` on Render and to Google JS origins.
6. **Google Cloud** → OAuth consent screen (External, publish it) → Web client
   ID with JS origins: Pages URL, `http://localhost:3000`. Client ID goes to
   Render (`GOOGLE_CLIENT_ID`) and Pages (`VITE_GOOGLE_CLIENT_ID`).
7. Warm `https://<api>/api/health/` 60 s before any demo.

| Render env var | Value |
| --- | --- |
| `DJANGO_SECRET_KEY` | `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DJANGO_ALLOWED_HOSTS` | the real Render domain (check the service page for suffixes) |
| `CSRF_TRUSTED_ORIGINS` | `https://<same domain>` — /admin/ 403s without it |
| `CORS_ALLOWED_ORIGINS` | Pages URL (+ `http://localhost:3000` for dev) |
| `PUBLIC_API_BASE_URL` | `https://<same domain>` |
| `POSTGRES_HOST/DB/USER/PASSWORD` | from Neon (SSL is automatic) |
| `GOOGLE_CLIENT_ID` | from step 6 |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | photos; without them photo uploads 503, flows still work |
| `RAZORPAY_KEY_ID/KEY_SECRET` + `PAYMENT_PROVIDER=razorpay_base` | when the base account KYC lands; until then `manual` mode |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay dashboard → webhooks → `https://<domain>/api/webhooks/payment/`, event `payment_link.paid` |
| `ADMIN_EMAIL/ADMIN_PASSWORD` | first build only, then delete |
| `SENDGRID_API_KEY/DEFAULT_FROM_EMAIL` | optional (password-register emails only) |

| Pages env var | Value |
| --- | --- |
| `VITE_API_URL` | `https://<render-domain>/api` |
| `VITE_GOOGLE_CLIENT_ID` | same client ID |
| `VITE_ADMIN_EMAILS` | the founder roll-number email (comma-separated for more) |

## Every deploy after that

Push to main. Backend CI green → production updates itself in ~2 min.
CI red → nothing deploys; fix main, don't force it.

## Recurring jobs

| Task | How |
| --- | --- |
| Logs | Render dashboard → service → Logs (correlate on `X-Request-ID`) |
| Resolve a report | `/admin/` → Reports → read, set status, blame action feeds trust counts |
| Stuck order | `/admin/` → Requests → filter by status; StatusChange rows = audit trail |
| Add an admin | `/admin/` → Users → is_staff |
| Payouts (MoR mode) | `GET /api/admin/payouts/?status=due` → pay helper UPI → mark-paid with UTR |
| Roll back | Render → Manual Deploy → pick the previous deploy |

## Free-tier limits and what breaks first

| Resource | Limit | Symptom | Fix |
| --- | --- | --- | --- |
| Render hours | 750/mo | suspended until reset | Starter $7/mo |
| Render cold start | 15 min idle | first request ~1 min | expected; warm before demos; UptimeRobot ping |
| Neon storage | 0.5 GB | writes fail | prune old rows; $19/mo |
| SendGrid | 100 emails/day | register emails stop | irrelevant once everyone uses Google sign-in |

Capacity: 200 active users fits everything. At ~1000, upgrade Render first,
then Neon.

## Incident cookbook

- **Google button missing on the site** → `VITE_GOOGLE_CLIENT_ID` not set on
  Pages, or the Pages URL isn't in Google JS origins.
- **"Google sign-in is not configured"** → `GOOGLE_CLIENT_ID` missing on Render.
- **Sign-in works locally but not on Pages** → JS origins; origins, not
  redirect URIs (GIS renders the button from the origin).
- **/admin/ login loops or CSRF errors** → `CSRF_TRUSTED_ORIGINS` must match
  the domain exactly, https included.
- **Order stuck `accepted`** → auto-releases to the feed after 30 min unpaid
  (by design). Stuck with payment `held` = real bug; inspect in /admin/.
- **Payment `pending` but user says they paid** → manual mode needs BOTH sides
  to confirm; gateway mode means the webhook didn't arrive — check
  `RAZORPAY_WEBHOOK_SECRET` and Razorpay's webhook delivery log.
- **Everything 404s after a web deploy** → Pages needs `web/public/_redirects`
  (already in repo); check it wasn't deleted.

## Demo-day checklist

- [ ] API warmed (health check 60 s before)
- [ ] Signed in with a real SASTRA Google account on the demo device
- [ ] One full dry-run order: post → accept → price w/ photo → approve → pay →
      purchased → OTP handover → completed
- [ ] Phone hotspot ready (campus Wi-Fi client isolation breaks same-network demos)
