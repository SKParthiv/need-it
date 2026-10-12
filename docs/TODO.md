# Status & What's Next

Updated 2026-10-12 (evening — pilot model revision, see decisions.md D7).
Backend code-complete for the pilot. Money model for pilot: **direct UPI
customer→helper, zero platform money, no commission** — Razorpay/KYC is no
longer a launch blocker (commission version is post-pilot).

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

1. **Google OAuth client ID** — Google Cloud console → OAuth consent screen →
   Web client ID (JS origins: localhost:3000 + the API/Pages URLs). Powers
   sign-in; kills the whole email-verification dependency. Then
   `GOOGLE_CLIENT_ID` on Render + `VITE_GOOGLE_CLIENT_ID` for the web build.
2. **Cloudinary free account** — cloud name + API key/secret → the three
   `CLOUDINARY_*` vars. Without them photos are off (flows still work).
3. **`RENDER_DEPLOY_HOOK_URL` GitHub secret** — wires CI-green → auto-deploy.
4. **Cloudflare Pages for `web/`** — the visible URL. Then
   `CORS_ALLOWED_ORIGINS` + `PUBLIC_WEB_URL` on Render.
5. **Mobile app source into this repo** — `apps/mobile/` is only the android
   shell. The API's real client is still missing from the monorepo.
6. **Remove `ADMIN_EMAIL`/`ADMIN_PASSWORD`** from Render after first deploy.

## Building next (code)

- `POST /api/auth/google/` — verify Google ID token, require
  `hd == sastra.ac.in`, link-or-create account born verified (userflow-v2 §2).
- Trust system v1 (userflow-v2 §7): two-direction ratings + problem-count
  blocks with admin-tunable thresholds (`/admin/`, no redeploy).
- Chat image attachments via the existing Cloudinary signature pipe.

## Post-pilot backlog (in priority order)

- **Commission version**: helper pays a flat fee per order via Razorpay
  (provider seam already built, PR #22; needs base-account KYC then)
- FCM push notifications (with the mobile app)
- Rate limiting on register/login/pay
- Data pruning job (old orders/notifications) before Neon 0.5 GB fills
- Razorpay Route (true escrow) — BLOCKED on ₹40L turnover (RBI rule)
- Shops module (cut for pilot, revive only if shops actually ask)
