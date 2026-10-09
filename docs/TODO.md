# Need It — TODO / Next Steps

_Updated 2026-10-09, after backend phases 1–7 + deployment automation landed._

## Where we are

- **Backend:** Phases 1–7 done — auth, requests/feed, accept-with-lock, price confirmation, escrow core, handover codes, chat. Tests per app. Local + scalable deployment documented and automated (`docs/backend-setup-and-deployment.md`, Docker Compose).
- **Backend remaining:** Phase 8 notifications, Phase 9 availability, Phase 10 reports/trust, Phase 11 shops (probably cut for pilot), Phase 12 production hardening.
- **Mobile:** ⚠️ `apps/mobile/` contains only the native `android/` shell. The actual Expo source — `package.json`, `app.json`, `src/`, all screens — is **not in this repo**. Nobody else can build or run the app today.
- **Web:** company site lives in `web/`.
- **Workflow:** PR flow is working (PRs #4–6 merged). Keep it: one phase or one feature per PR.

## Blocking founder decisions (make these first)

1. **Escrow vs direct-UPI.** The mobile payment flow (scan QR, pay the helper directly, zero commission) contradicts the escrow backend (`held → purchased → handover → released`). Pick one before any more payment UI is written. Escrow is the product thesis — no cash-fronting, no admin; direct-QR is simpler but makes the payments app dead code and removes the safety story.
2. **Razorpay Route KYC.** Weeks of paperwork — start it now, in parallel with everything else. Backend runs on `ManualUPIProvider` until it lands; the `PaymentProvider` interface makes the flip local.
3. **App source of truth.** Recommended: this monorepo, `apps/mobile/`. One repo, one contract, both founders can build.

## Thinesh — frontend / mobile

1. **Land the real Expo source in `apps/mobile/`** — without `node_modules`, without `android/` build artifacts, without the tracked `debug.keystore`. Check the root `.gitignore` covers `node_modules/`, `.expo/`, `android/build`, `*.keystore` before committing.
2. **API client layer:** base URL from config, Bearer token in secure storage, one typed function per endpoint. No fetch calls scattered through screens.
3. **Wire screens in state-machine order:** auth → create request → feed → accept → price confirm → payment status → handover codes → chat. Render from server status only — never invent client-side transitions.
4. **Hold payment UI** until Decision 1 is made.

## Parthiv — backend

1. **Phase 8 — Notifications (FCM).** Device-token registration endpoint; push on every status transition and chat message. This is the pilot blocker: without push, helpers never learn an order exists.
2. **Phase 9 — Helper availability toggle.**
3. **Phase 10 — Reports (minimal: report + block).**
4. **Phase 12 — Production deploy** per `docs/backend-setup-and-deployment.md`; real webhook signature verification once KYC lands.
5. **Skip Phase 11 (shops)** unless the pilot demands it.

## Both — shared

- **API contract doc** (`docs/api-contract.md`): every endpoint, request/response shapes, and the two status vocabularies below, exported once. Both sides code against it; changes go through PR review like code.
- **Pilot before production:** 5–10 real orders with friends on the local stack (deployment doc, Option A) before any public deploy.

### The status vocabularies (the contract — match exactly)

- **Order:** `open → accepted → purchased → handed_over → completed` (+ `cancelled` from most states; `accepted → open` is the release path)
- **Payment:** `none → pending → held → released` (+ `failed` / `refunded`)

## Hygiene

- Remove `apps/mobile/android/app/debug.keystore` from tracking (build artifact, shouldn't be in git).
- Confirm no `node_modules` or build output enters history when the app source lands — cleaning it out of history later is painful.
