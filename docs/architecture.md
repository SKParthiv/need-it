# Need It — Architecture

The system truth as deployed. If the code disagrees with this file, the code
wins — update this file in the same PR.

## Runtime stack (what actually runs)

| Concern | Technology | Notes |
| --- | --- | --- |
| API | Django 5 + DRF, Gunicorn | Token auth (Bearer), no sessions except /admin/ |
| Database | PostgreSQL (Neon free, 0.5 GB) | sqlite fallback only when `POSTGRES_HOST` unset (local) |
| Static/admin | WhiteNoise | collectstatic runs in the deploy build |
| Hosting | Render free web service | 512 MB, sleeps after 15 min idle, no shell |
| Web client hosting | Cloudflare Pages | static build of `web/` |
| Email | Brevo HTTP API (django-anymail) | Render free blocks SMTP ports; Brevo = 300/day free |
| Push | none yet | FCM planned with the mobile app |
| Photos | none yet | S3-compatible URLs only, never DB blobs |
| Background jobs | none | `sweep_stale_accepted()` runs lazily on every feed read |

Deliberately absent (do not re-add without a reason): Celery/Redis (a worker +
broker is dead weight at pilot scale), Docker-in-prod (Render builds from
source), Shops module (cut for pilot), backend admin API (founder ops happen
in /admin/).

## Monorepo layout

```
apps/mobile/   android shell only — the Expo app source is NOT here yet (blocker)
web/           Vite + React web client (also an app client, not just a site)
backend/       the entire server: config/ + apps/{users,orders,payments,
               notifications,availability,reports,chat}
docs/          this folder
render.yaml    Render Blueprint (the whole infra definition)
.github/       backend-ci.yml (prod-config tests), ci.yml (web), deploy.yml (CD)
```

## The invariants (enforced in code, tested)

1. **Escrow gate** — an order becomes `purchased` only when its payment is
   `held`. The helper never fronts cash. (`services.mark_purchased`)
2. **Guarded transitions** — every status move is a guarded UPDATE checking
   the expected current status; zero rows affected = conflict, not silent
   success. (`_guarded_move`)
3. **One helper** — accept is atomic; a second accept gets a conflict.
4. **Idempotent money** — pay twice and nothing double-charges or regresses;
   release is a no-op unless `held`; webhook events dedupe on
   `provider_event_id`.
5. **Ownership at the service layer** — every transition checks the actor,
   never the frontend.
6. **Charge actuals** — payments charge confirmed `actual_price` (excluding
   unavailable items) + validated helper fee, never the expected guess.
7. **Audit log** — every transition appends a StatusChange row.

## Payment provider seam

The state machine never touches a gateway. It calls the `PaymentProvider`
interface (`apps/payments/providers.py`); `PAYMENT_PROVIDER` picks the
implementation. Pilot = `ManualUPIProvider` (both sides confirm an
out-of-band UPI transfer; "held" is a record that gates the machine).
Razorpay Route slots in behind the same interface once KYC clears — the
stubs mark the exact call sites. Webhook skeleton verifies signatures and
dedupes events; it maps events to states once Razorpay is live.

## Auth & users

Token auth: `Authorization: Token <key>`. Registration is restricted to
`COLLEGE_EMAIL_DOMAINS` (sastra.ac.in in prod). Email verification: Brevo
sends a one-click GET link; without email config the API returns the token
in the register response (pilot mode — convenient, proves nothing).
Superuser is created by `ensure_admin` during deploy (Render free has no
shell) from `ADMIN_EMAIL`/`ADMIN_PASSWORD` — remove those vars after first
deploy.
