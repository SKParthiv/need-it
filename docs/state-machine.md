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
| purchased | handed_over | Helper enters the customer's 4-digit OTP | Single attestation — the customer SHOWS it, the helper ENTERS it |
| purchased | cancelled | Customer cancels **with helper agreement** | Dispute path |
| handed_over | completed | Settlement webhook confirms release | Mechanical — no human step |
| completed / cancelled | — | terminal | No further transitions |

Any transition not in this table is impossible: the service layer rejects it,
and the guarded write means a stale or double action can never corrupt state.

## Payment sub-machine (parallel, gates the order machine)

`none → pending → held → released` · `pending → failed` · `held → refunded`

**Pilot semantics: direct UPI, zero platform money.** After the customer
approves prices, the app shows the helper's UPI QR (rendered client-side
from the helper's `upi_id`). The customer pays the **helper directly** in
their own UPI app, then POSTs `pay` (→ `pending`); the helper confirms the
money arrived (`confirm-payment` → `held`). The platform never holds,
collects, or forwards anything — "held" means *the helper's own UPI app
shows the money*. No Razorpay, no KYC, no commission in the pilot.

| Payment event | Effect on order |
|---|---|
| `held` | Unlocks `accepted → purchased` |
| `failed` | Order stays `accepted`; customer retries |
| Timeout (no payment after price approval) | Order auto-releases to `open`, helper notified |
| OTP confirmed | Release recorded (ledger flip, idempotent) → order `completed` |
| Cancel before purchase | Refund → `refunded` |

Post-pilot, the commission version (helper pays the platform a flat fee per
order via Razorpay) reuses the same provider seam — see decisions.md D7.

## Money rules

- Charge the **actual confirmed amount** (item cost + helper fee), never the expected-price guess.
- Price approval is **evidence-based**: the helper attaches a shelf/receipt photo (`evidencePhotoUrl` on the item) when proposing a price; the customer approves what they can see. Photos upload straight to Cloudinary with a server-issued signature — our API never proxies bytes.
- The customer pays the **helper directly** (UPI, off-platform). The helper
  confirms receipt before shopping — helpers never front their own cash.
- Handover OTP = attestation. The code is born at `mark_purchased`, renders in the API **only to the customer**, and the helper entering it correctly means the items physically changed hands — payment releases in the same guarded transition. 5 wrong codes lock the endpoint (founder unlocks via `/admin/`).
- Webhooks (post-pilot Razorpay only): verify signature; dedupe on gateway event ID (retries are idempotent).

## The three rules

1. **Server owns the machine.** The app renders state; it never asserts it.
2. **Every transition is a guarded DB update** — rows-affected checked, inside a transaction.
3. **Every change is audited** — `StatusChange` rows record from/to/actor/time.
