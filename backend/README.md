# Need It — Backend

Django + DRF + Postgres. Owns the order state machine and the escrow.
The app renders state; only this service decides it.

## The two rules that make it trustworthy

1. **Every state change is a guarded DB update.** A transition only writes if the
   row is still in the expected state (`UPDATE ... WHERE status=expected`, rows-
   affected checked). Two helpers tapping "accept" can't both win; an illegal
   transition can never be written. See `apps/orders/services.py`.
2. **Money moves only through the provider interface.** `mark_purchased` is
   gated on payment `HELD` — the helper never fronts cash, enforced in code.
   `apps/payments/providers.py` has `ManualUPIProvider` (pilot) and
   `RazorpayRouteProvider` (real escrow, flip `PAYMENT_PROVIDER` when KYC clears).

## Setup

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
# Copy .env.example to .env and fill in deployment values when needed.
python manage.py migrate
python manage.py check
python manage.py test apps.users apps.orders apps.payments apps.chat
python manage.py runserver
```

When `POSTGRES_HOST` is unset, local development and tests use SQLite. Set it
in `.env` to use Postgres.

For the complete PostgreSQL, Redis/Celery, object storage, Render, and CI/CD
setup, see [`docs/backend-setup-and-deployment.md`](../docs/backend-setup-and-deployment.md).

## Status of each app

| App | State |
|---|---|
| `orders` | state machine + guarded transitions — **done, tested** |
| `payments` | escrow abstraction + manual provider + webhook skeleton — **done, tested** (razorpay = stubs) |
| `users` | custom user model, registration, verification, and token auth |
| `chat` | polling messages, URL-only photo references, completed-order read-only mode |

Everything environment-specific is in `.env` (see `.env.example`). No real keys,
no paid accounts assumed — runs locally on free defaults.
