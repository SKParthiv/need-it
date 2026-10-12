# Status & What's Next

Updated 2026-10-12. Backend code-complete for the pilot **including the real
money path**. What remains is accounts, deploy, and the mobile client.

## Done

- Backend phases 1–12: auth (+email verification), requests/feed, accept-lock,
  price confirmation, escrow core, handover codes, chat, notifications,
  availability, reports, deploy pipeline. **91 tests, CI green.**
- **Money (merchant of record)** — PRs #19–#22:
  - Payout console: per-completed-order payout rows, ₹2 flat cut clamped to
    the helper fee, staff-only mark-paid with UTR, helper earnings view (#19).
  - Handover OTP: customer shows a 4-digit code, helper enters it, money
    moves. Single attestation, 5-strike lock (#20).
  - Evidence-based price approval: shelf photos via signed direct→Cloudinary
    uploads; customer approves prices they can see (#21).
  - Real collection: Razorpay Payment Links on a base account; only the
    signed webhook marks money held; release is a ledger flip; refunds mirror
    capture state (#22).
- Production pipeline: push to main → Backend CI green → Render auto-deploys.
- Docs: architecture, API reference, operations, deploy guide, local dev,
  **decisions register** (`decisions.md`).

## Blockers (founder actions, not code)

1. **Deploy** — ~30 min in `deploy-free-tier.md`: Neon → Render env vars →
   Brevo key → `RENDER_DEPLOY_HOOK_URL` secret → Pages.
2. **Razorpay individual account** — PAN + Aadhaar + savings a/c, ~3–4
   working days. **Base account only — do NOT apply for Route** (₹40L
   turnover gate, RBI). During KYC, ask about **RazorpayX Payouts** (could
   automate helper settlement later). Then: test keys → `RAZORPAY_KEY_ID` /
   `RAZORPAY_KEY_SECRET`, webhook (URL `https://<api>/api/webhooks/payment/`,
   event `payment_link.paid`) → `RAZORPAY_WEBHOOK_SECRET`, flip
   `PAYMENT_PROVIDER=razorpay_base`, test with ₹1.
3. **Cloudinary free account** — cloud name + API key/secret → the three
   `CLOUDINARY_*` vars. Without them photo evidence is off (prices still work).
4. **Mobile app source into this repo** — `apps/mobile/` is only the android
   shell. The API's real client is still missing from the monorepo.
5. **Remove `ADMIN_EMAIL`/`ADMIN_PASSWORD`** from Render after first deploy.

## Post-pilot backlog (in priority order)

- FCM push notifications (with the mobile app)
- Rate limiting on register/login/pay
- Data pruning job (old orders/notifications) before Neon 0.5 GB fills
- RazorpayX Payouts wiring (if the KYC conversation says it's available)
- Razorpay Route — BLOCKED on ₹40L turnover (RBI rule); revisit post-scale
- Shops module (cut for pilot, revive only if shops actually ask)
