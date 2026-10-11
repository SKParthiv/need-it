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
3. **Escrow vs direct-UPI** — decide the pilot money model. Current code
   runs ManualUPIProvider (both-sides-confirm). If the pilot is direct-UPI,
   say so and the pay flow gets simplified; if escrow, start Razorpay KYC
   NOW — it's weeks of paperwork and the only long pole.
4. **Remove `ADMIN_EMAIL`/`ADMIN_PASSWORD`** from Render after first deploy.

## Post-pilot backlog (in priority order)

- Razorpay Route wiring (`apps/payments/providers.py` stubs mark the seams)
- FCM push notifications (with the mobile app)
- Photo upload (S3-compatible; URLs only in DB)
- Backend admin API (today: /admin/ web only — fine at founder scale)
- Rate limiting on register/login/pay
- Data pruning job (old orders/notifications) before Neon 0.5 GB fills
- Shops module (cut for pilot, revive only if shops actually ask)
