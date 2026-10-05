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
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in values
python manage.py makemigrations users orders payments chat
python manage.py migrate
python manage.py test          # proves the escrow invariants
python manage.py runserver
```

## Status of each app

| App | State |
|---|---|
| `orders` | state machine + guarded transitions — **done, tested** |
| `payments` | escrow abstraction + manual provider + webhook skeleton — **done, tested** (razorpay = stubs) |
| `users` | custom user model + roles — model done; register/verify TODO |
| `chat` | model done; views TODO |

Everything environment-specific is in `.env` (see `.env.example`). No real keys,
no paid accounts assumed — runs locally on free defaults.
