# Status & What's Next

Updated 2026-10-14 (money model v2 — merchant of record, see decisions.md
D9). Backend code-complete for the pilot. Money model: **platform collects
via Razorpay payment links** (base account), webhook marks held, OTP
triggers release, founder settles payouts manually (UTR). Zero commission
in pilot (`PLATFORM_CUT_PER_ORDER=0`).

## Done

- Backend phases 1–12: auth (+email verification), requests/feed, accept-lock,
  price confirmation, escrow core, handover codes, chat, notifications,
  availability, reports, deploy pipeline. **91 tests, CI green.**
- Money machinery — PRs #19–#22 (pilot uses only the manual/direct path;
  Razorpay collection is reserved for the post-pilot commission version):
  - Payout console: per-completed-order payout rows, ₹2 flat cut clamped to
    the helper fee, staff-only mark-paid with UTR, helper earnings view (#19).
  - Handover OTP: customer shows a 4-digit code, helper enters it, money
    moves. Single attestation, 5-strike lock (#20).
  - Evidence-based price approval: shelf photos via signed direct→Cloudinary
    uploads; customer approves prices they can see (#21).
  - Real collection: Razorpay Payment Links on a base account; only the
    signed webhook marks money held; release is a ledger flip; refunds mirror
    capture state (#22).
- Register can't 500 on email failure; resend-verification endpoint (#26).
- Email provider support for SendGrid (#25) — **moot for pilot**: Google
  sign-in replaces email verification as the primary path (userflow-v2 §2).
- Production pipeline: push to main → Backend CI green → Render auto-deploys.
- Deployed: Neon (PostgreSQL 18.6 verified) + Render live at
  `needit-api-orfb.onrender.com`.
- Docs: **userflow-v2.md is the pilot contract**; architecture, API
  reference, operations, deploy guide, local dev, decisions register.

## Blockers (founder actions, not code)

1. **Razorpay base account + keys** (D9 — the money blocker): sign up as
   unregistered individual (PAN + Aadhaar + CKYC OTP + savings account,
   ~3–4 working days) → get Key ID/Secret → Render env `RAZORPAY_KEY_ID`,
   `RAZORPAY_KEY_SECRET`, `PAYMENT_PROVIDER=razorpay_base`,
   `PLATFORM_CUT_PER_ORDER=0`. Then Razorpay dashboard → webhooks → URL
   `https://needit-api-orfb.onrender.com/api/webhooks/payment/`, event
   `payment_link.paid`, secret → `RAZORPAY_WEBHOOK_SECRET`. Until then the
   site runs the `manual` demo provider.
2. **Google OAuth client ID** — Google Cloud console → OAuth consent screen →
   Web client ID (JS origins: localhost:3000 + the API/Pages URLs). Powers
   sign-in; kills the whole email-verification dependency. Then
   `GOOGLE_CLIENT_ID` on Render + `VITE_GOOGLE_CLIENT_ID` for the web build.
3. **Cloudinary free account** — cloud name + API key/secret → the three
   `CLOUDINARY_*` vars. Without them photos are off (flows still work).
4. **`RENDER_DEPLOY_HOOK_URL` GitHub secret** — wires CI-green → auto-deploy.
5. **Cloudflare Pages for `web/`** — the visible URL. Then
   `CORS_ALLOWED_ORIGINS` + `PUBLIC_WEB_URL` on Render.
6. **Mobile app source into this repo** — `apps/mobile/` is only the android
   shell. The API's real client is still missing from the monorepo.
6. **Remove `ADMIN_EMAIL`/`ADMIN_PASSWORD`** from Render after first deploy.

## Building next (code)

- ~~`POST /api/auth/google/`~~ — **done** (#31).
- ~~Payment card chat message~~ — **done** (#32): server posts a
  `payment_card` system message (upiId + itemCost + fee bounds) when all
  prices are approved; clients render the QR and compose the `upi://` link.
- ~~Trust system v1~~ — **done** (#33): `Rating` + `ProblemEvent` +
  `TrustPolicy` (admin-tunable in `/admin/`); blocks on post/accept;
  report-resolve blame actions; flake auto-detection.
- Chat image attachments via the existing Cloudinary signature pipe.

## Post-pilot backlog (in priority order)

- **Commission version**: helper pays a flat fee per order via Razorpay
  (provider seam already built, PR #22; needs base-account KYC then)
- FCM push notifications (with the mobile app)
- Rate limiting on register/login/pay
- Data pruning job (old orders/notifications) before Neon 0.5 GB fills
- Razorpay Route (true escrow) — BLOCKED on ₹40L turnover (RBI rule)
- Shops module (cut for pilot, revive only if shops actually ask)
