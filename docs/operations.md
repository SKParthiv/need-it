# Operations Runbook

Everything a founder needs to run Need It in production. First deploy lives
in `deploy-free-tier.md`; this file is day 2 onward.

## First-deploy checklist (condensed)

1. Neon project created; 4 `POSTGRES_*` values in Render.
2. Render Blueprint deployed; `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`,
   `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`, `PUBLIC_API_BASE_URL` set.
3. `ADMIN_EMAIL`/`ADMIN_PASSWORD` set for the first build, superuser confirmed
   at `/admin/`, then **both vars removed**.
4. `BREVO_API_KEY` + `DEFAULT_FROM_EMAIL` (verified sender) set; register a
   test account and confirm the email arrives.
5. `RENDER_DEPLOY_HOOK_URL` added as a GitHub Actions secret → pipeline live
   (push → green Backend CI → auto deploy).
6. Cloudflare Pages site up; `VITE_API_URL` set; Pages URL added to
   `CORS_ALLOWED_ORIGINS`.

The unauthenticated health check is `GET /api/health/`. For incidents, copy
the response's `X-Request-ID` and use it to correlate request, order
transition, and payment transition entries in Render logs.

## Every deploy after that

Push to main. If Backend CI is green, production updates itself in ~2 min.
If CI is red, nothing deploys — fix main, don't force it.

## Recurring jobs

| Task | How |
| --- | --- |
| Check logs | Render dashboard → service → Logs (live tail) |
| Resolve a report | `/admin/` → Reports → read, change status, act on the order/user |
| Look at a stuck order | `/admin/` → Requests → filter by status; StatusChange rows show the full audit trail |
| Add an admin | `/admin/` → Users → set is_staff (they log into /admin/ with their account) |
| Warm the API before a demo | open `https://<domain>/` 60s before; free tier cold-starts ~1 min after 15 min idle |
| Rotate the secret key | new value in Render env → redeploy (logs everyone out — tokens die) |
| Roll back | Render → service → Manual Deploy → pick the previous deploy |

## Free-tier limits and what breaks first

| Resource | Limit | Symptom when hit | Fix |
| --- | --- | --- | --- |
| Render hours | 750/mo (month = 744 hrs) | service suspended until month reset | upgrade to Starter $7/mo |
| Neon storage | 0.5 GB | writes fail | prune old orders; upgrade $19/mo |
| Brevo email | 300/day | verification emails stop sending | they queue next day; or verify sender domain + paid |
| Render cold start | 15 min idle | first request takes ~1 min | expected; warm before demos |

Capacity guide: 200 active users fits all four limits. At ~1000, upgrade
Render first (sleep + shared CPU is the first real pain), then Neon.

## Incident cookbook

- **Users can't register** → Render logs: email errors mean Brevo key/sender
  issue; the API still returns tokens in the response if email is
  unconfigured — check `BREVO_API_KEY` is present.
- **/admin/ login loops or CSRF errors** → `CSRF_TRUSTED_ORIGINS` must equal
  `https://<your-render-domain>` exactly.
- **Orders stuck `accepted` forever** → they auto-release to the feed after
  30 min without payment (by design). If one is stuck with payment `held`,
  that's a real bug — check logs, use /admin/ to inspect, and file it.
- **A payment is `pending` but user says they paid** → in pilot mode "held"
  requires BOTH sides to confirm; check with the helper first, then
  /admin/ → Payments.

## Demo-day checklist

- [ ] API warmed (hit `/` 60s before)
- [ ] Two fresh test accounts registered + verified (email deliverability proven)
- [ ] web/.env has `VITE_ADMIN_EMAILS` on the demo laptop
- [ ] One full dry-run order: create → accept → price → approve → pay →
      confirm ×2 → purchased → handover ×2 → completed, on the demo network
- [ ] Phone hotspot ready (campus Wi-Fi client isolation breaks LAN demos)
