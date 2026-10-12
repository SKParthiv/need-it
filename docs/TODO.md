# Status & What's Next

Updated 2026-10-11. Backend code-complete for the pilot; what remains is
accounts, decisions, and the mobile client.

## Done

- Backend phases 1–12: auth (+email verification), requests/feed, accept-lock,
  price confirmation, escrow core, handover codes, chat, notifications,
  availability, reports, deploy pipeline. **49 tests, CI green.**
- Production pipeline: push to main → Backend CI green → Render auto-deploys.
- Docs: architecture, API reference, operations, deploy guide, local dev.

## Blockers (founder actions, not code)

1. **Deploy** — ~30 min in `deploy-free-tier.md`: Neon → Render env vars →
   Brevo key → `RENDER_DEPLOY_HOOK_URL` secret → Pages.
2. **Mobile app source into this repo** — `apps/mobile/` is only the android
   shell. The API has zero real clients until the Expo app lands here.
3. **Pilot money model** — decided FOR us at this stage: true gateway escrow
   (Razorpay Route) needs ₹40L turnover per RBI's Sept 2025 PA rules — not
   available to a zero-revenue pilot, at ANY aggregator. So the pilot runs
   direct/manual UPI (current ManualUPIProvider, both-sides-confirm); decide
   how the platform fee is actually collected (weekly settlement, separate
   UPI, etc.). A BASE Razorpay account (collect to one bank account) IS
   available as an individual (PAN + Aadhaar + savings a/c, ~3-4 working
   days) — worth getting for future fee collection, but it is not escrow.
4. **Remove `ADMIN_EMAIL`/`ADMIN_PASSWORD`** from Render after first deploy.

## Post-pilot backlog (in priority order)

- Razorpay Route wiring — BLOCKED on ₹40L turnover (RBI rule); revisit post-scale
- FCM push notifications (with the mobile app)
- Photo upload (S3-compatible; URLs only in DB)
- Backend admin API (today: /admin/ web only — fine at founder scale)
- Rate limiting on register/login/pay
- Data pruning job (old orders/notifications) before Neon 0.5 GB fills
- Shops module (cut for pilot, revive only if shops actually ask)
