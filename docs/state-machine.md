# Need It — Order State Machine (the contract)

This is the one page both founders build against. The backend enforces it
(`backend/apps/orders/`), the app renders it. Nothing here changes without
everyone agreeing.

## Order states

`open → accepted → purchased → handed_over → completed`

`cancelled` is a separate end state, reachable per the table below.

## Transitions

| From | To | Trigger | Guard |
|---|---|---|---|
| open | accepted | Helper accepts | Atomic `UPDATE ... WHERE status='open'` — exactly one helper wins; loser gets 409 |
| accepted | open | Helper releases, **or** payment-timeout job fires | Only before purchase; helper is cleared |
| accepted | purchased | Helper marks purchased | **Escrow gate: payment must be `held`** — helper never fronts cash |
| accepted | cancelled | Customer cancels before purchase | Triggers refund if payment exists |
| purchased | handed_over | Both one-time codes confirmed | Both sides must confirm |
| purchased | cancelled | Customer cancels **with helper agreement** | Dispute path |
| handed_over | completed | Settlement webhook confirms release | Mechanical — no human step |
| completed / cancelled | — | terminal | No further transitions |

Any transition not in this table is impossible: the service layer rejects it,
and the guarded write means a stale or double action can never corrupt state.

## Payment sub-machine (parallel, gates the order machine)

`none → pending → held → released` · `pending → failed` · `held → refunded`

| Payment event | Effect on order |
|---|---|
| `held` | Unlocks `accepted → purchased` |
| `failed` | Order stays `accepted`; customer retries |
| Timeout (no payment after price approval) | Order auto-releases to `open`, helper notified |
| Both codes confirmed | Release call (idempotent key) → webhook → `released` → order `completed` |
| Cancel before purchase | Refund → `refunded` |

## Money rules

- Charge the **actual confirmed amount** (item cost + helper fee), never the expected-price guess.
- The **gateway** holds the money (Razorpay Route), never us. Pilot runs on `ManualUPIProvider`; flip `PAYMENT_PROVIDER` when KYC lands.
- Handover confirm = attestation. The customer's confirm copy: **"I've received my items — release payment."**
- Webhooks: verify signature; dedupe on gateway event ID (retries are idempotent).

## The three rules

1. **Server owns the machine.** The app renders state; it never asserts it.
2. **Every transition is a guarded DB update** — rows-affected checked, inside a transaction.
3. **Every change is audited** — `StatusChange` rows record from/to/actor/time.
