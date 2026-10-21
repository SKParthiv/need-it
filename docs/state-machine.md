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
| open | accepted | Helper accepts | Atomic `UPDATE ... WHERE status='open'` + Helper collateral $\ge$ order total — exactly one helper wins; loser gets 409 |
| accepted | open | Helper releases, **or** payment-timeout job fires | Only before purchase; helper is cleared, collateral uncommitted |
| accepted | purchased | Helper marks purchased | **Gate: payment must be `held`** (advance received by helper) — helper never fronts cash |
| accepted | cancelled | Customer cancels before purchase | Triggers reimbursement if advance was confirmed |
| purchased | handed_over | Helper enters the customer's 4-digit OTP | Single attestation — the customer SHOWS it, the helper ENTERS it |
| purchased | cancelled | Customer cancels **with helper agreement** | Dispute path |
| handed_over | completed | Handover validated | Mechanical — releases payment record and uncommits helper collateral |
| completed / cancelled | — | terminal | No further transitions |

Any transition not in this table is impossible: the service layer rejects it,
and the guarded write means a stale or double action can never corrupt state.

## Payment sub-machine (parallel, gates the order machine)

`none → pending → held → released` · `pending → failed` · `held → refunded`

**Pilot semantics (D12): Helper Collateral + Advance Direct UPI.**
After the customer approves actual shelf prices, the server posts a payment
card with a universal UPI deep link (`upi://pay`) and dynamic QR code:
1. Customer initiates transfer in FamPay/GPay/PhonePe/Paytm and taps "I've Sent Payment" (→ `pending`).
2. Helper verifies the credit in their bank/UPI app and taps "Confirm Receipt"
   (→ `held`, held under collateral guard).
3. `held` payment unlocks `accepted → purchased` — the helper purchases items
   at the store using the customer's advance money (helpers never front cash).
4. Customer meets helper and shows the 4-digit OTP. Helper inputs the code:
   payment flips to `released`, order is marked `completed`, and the helper's
   committed collateral is released.
5. If helper absconds after receiving advance money, the customer is reimbursed
   from the helper's collateral deposit (→ `refunded`) and the helper's account
   is banned.
6. Zero commission in pilot (`PLATFORM_CUT_PER_ORDER=0`).

| Payment event | Effect on order |
|---|---|
| `held` (advance confirmed received) | Unlocks `accepted → purchased` |
| `failed` | Order stays `accepted`; customer retries |
| Timeout (no payment after price approval) | Order auto-releases to `open`, helper cleared, collateral released |
| OTP confirmed | Release recorded → order `completed` |
| Ghosting / flake after advance payment | Customer reimbursed from helper collateral → `refunded` |

## Money rules

- Charge the **actual confirmed amount** (item cost + helper fee), never the expected-price guess.
- Price approval is **evidence-based**: the helper attaches a shelf/receipt photo (`evidencePhotoUrl` on the item) when proposing a price; the customer approves what they can see. Photos upload straight to Cloudinary with a server-issued signature — our API never proxies bytes.
- Direct advance payment: Customer pays helper directly via universal `upi://pay` deep link or dynamic QR. Helper shops only with customer's advance funds — helpers never front their own cash.
- Helper collateral guarantee: Helper maintains a ₹200 refundable security deposit. Uncommitted collateral must cover order goods cost. Flaking or ghosting forfeits collateral to reimburse the customer.
- Handover OTP = attestation. The code is born at `mark_purchased`, renders in the API **only to the customer**, and the helper entering it correctly means the items physically changed hands. 5 wrong codes lock the endpoint (founder unlocks via `/admin/`).

## The three rules

1. **Server owns the machine.** The app renders state; it never asserts it.
2. **Every transition is a guarded DB update** — rows-affected checked, inside a transaction.
3. **Every change is audited** — `StatusChange` rows record from/to/actor/time.
