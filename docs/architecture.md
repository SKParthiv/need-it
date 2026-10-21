# Need It — Architecture

The system truth as deployed. If the code disagrees with this file, the code
wins — update this file in the same PR.

## Runtime stack

| Concern | Technology | Notes |
| --- | --- | --- |
| API | Django 5 + DRF, Gunicorn | Token auth (Bearer), no sessions except /admin/ |
| Database | PostgreSQL (Neon free, 0.5 GB) | sqlite fallback only when `POSTGRES_HOST` unset (local) |
| Hosting | Render free web service | 512 MB, sleeps after 15 min idle, no shell |
| Web client | Cloudflare Pages | static build of `web/` |
| Photos | Cloudinary | signed direct uploads from the client; API stores URLs only |
| Email | SendGrid HTTP API | only for the password-register path; Google sign-in needs none |
| Push | none yet | FCM planned with the mobile app |
| Background jobs | none | `sweep_stale_accepted()` runs lazily on every feed read |

Deliberately absent (do not re-add without a reason): Celery/Redis, Docker-in-prod,
Shops module (cut for pilot), unauthenticated admin backdoors (PR #33; mobile founder
ops live at authenticated `/app/admin`, D13), AI model runtime inference in pilot
(D14: anonymized data collection only per `docs/ai-roadmap.md`).

## Monorepo layout

```
web/           Vite + React web client (the only client today)
apps/mobile/   android shell only — the Expo app source is NOT here yet (blocker)
backend/       the entire server: config/ + apps/{users,orders,payments,
               notifications,availability,reports,chat,trust}
docs/          contract docs; docs/archive/ = historical artifacts
render.yaml    Render Blueprint (the whole infra definition)
.github/       backend-ci.yml (prod-config tests), ci.yml (web), deploy.yml (CD)
```

## Auth

**Google Workspace sign-in is the only client path** (D10). The client sends the
Google `id_token`; the server verifies signature, audience, `email_verified`,
and hosted domain `hd ∈ COLLEGE_EMAIL_DOMAINS` (sastra.ac.in in prod), then
auto-creates the account on first sign-in. There are no seeded or demo users.
Password register/login endpoints exist only for backend tests and ops scripts;
the web client does not expose them. `Authorization: Token <key>` on every
call after that.

## The invariants (enforced in code, tested)

1. **Escrow gate** — an order becomes `purchased` only when its payment is
   `held`. The helper never fronts cash.
2. **Guarded transitions** — every status move is a guarded UPDATE checking the
   expected current status; zero rows affected = conflict, not silent success.
3. **One helper** — accept is atomic; a second accept gets a 409.
4. **Idempotent money** — pay twice and nothing double-charges or regresses;
   webhook events dedupe on `provider_event_id`.
5. **Ownership at the service layer** — every transition checks the actor,
   never the frontend.
6. **Charge actuals** — payments charge confirmed `actual_price` (excluding
   unavailable items) + validated helper fee, never the expected guess.
7. **Audit log** — every transition appends a StatusChange row.
8. **Attested handover** — completion requires the customer's 4-digit OTP
   entered by the helper (5 wrong attempts lock the endpoint).

## Payment provider seam

The state machine never touches a gateway directly. It calls the `PaymentProvider`
interface (`apps/payments/providers.py`); `PAYMENT_PROVIDER` picks the mode.

- **`manual`** (`advance_upi`, pilot active mode per D12) — Direct Advance UPI
  backed by Helper Collateral. The backend composes a universal `upi://pay` deep
  link and dynamic QR code; customer pays helper directly in advance; helper
  confirms receipt; helper collateral guarantees customer against ghosting.
  Platform touches zero money and charges ₹0 commission.
- **`razorpay_base`** (D9) — Merchant of record on a BASE Razorpay account:
  `/pay` creates a Razorpay Payment Link into the platform account; the
  **signed webhook** is the only thing that marks money `held`. Available as an
  alternate provider for off-campus expansion.
- **`razorpay_route`** (stub) — True gateway escrow. Blocked by RBI's PA
  guidelines (₹40L domestic turnover, enforced Jan 1 2026) — the stub is the
  marked seam for that future.

## Client doctrine — lean by rule (D11)

Applies to `web/` today and `apps/mobile/` when it lands. The frontend stays
thin; the server stays the only brain.

1. **Server is the only source of truth.** A screen renders API data or a
   loading/empty state — never a local fabrication. Mock data in a production
   build is a bug. (Precedent: the fake profile-save, mock chat list, and mock
   shop portal were all deleted, PR #40.)
2. **One data layer.** Pages fetch only through `web/src/services/api.ts` +
   context. A new screen = one route + typed API methods — not a new state
   system, not ad-hoc fetch calls.
3. **Minimal request surface.** Prefer CRUD on existing resources (list,
   retrieve, create, update) over new bespoke endpoints. State transitions
   (accept / pay / handover) stay as small POST actions — they are events, not
   edits; that is the deliberate exception to CRUD purity.
4. **Poll deliberately, on the smallest set.** Current cadence: chat 3 s (while
   open), orders 5 s, notifications 15 s. Before adding anything faster:
   pause polling on hidden tabs, add jitter. SSE/websockets only if polling
   measurably hurts — see the math below.
5. **Caching rules.** Only GETs are cacheable, and per-user GETs are
   client-private (show-then-revalidate). The CDN (Cloudflare Pages) caches the
   static bundle, never `/api/`. The server may add ETag/Cache-Control on
   shared GETs (the feed) later; clients must tolerate 304.
6. **Delete before adding.** Lean is a subtraction discipline. A screen or
   endpoint with no pilot job gets cut, not hidden.

## Scaling & load balancing — why it already works

- **Stateless API.** Token auth (no session store), uploads go straight to
  Cloudinary, no in-process caches. Any instance can answer any request, so 2+
  instances behind a load balancer works with **zero code change** — the shared
  state lives entirely in Postgres (Neon), which is the first real bottleneck,
  not the app servers.
- **Request economics.** N online users generate ≈ N × (12 orders-polls +
  4 notification-polls) = **N × 16 req/min**. 200 users ≈ 53 rps only if every
  single user is online at once; at a realistic 10–15 % concurrency it is
  5–8 rps — trivially inside free tier. This math is why polling beats
  websockets until thousands of concurrent users.
- **Upgrade path, in order:** Render Starter ($7, removes sleep) → second
  instance (works today as-is) → Neon paid when DB storage/CPU pinches →
  ETag on the feed → read replicas. Only knobs change; the shape doesn't.
