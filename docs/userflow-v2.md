# Need It — User Flow & Backend Contract (v2, pilot)

**Read this first if you are building any client (mobile app or web).**
This document is written to be machine-readable: every screen action maps
to an exact API call, every state has an exact string, every rule names its
enforcement point. If something here disagrees with the code, the code is
wrong — file it. Supersedes the archive/ artifacts (mindmap HTML, PRD PDF, design brief PDF — kept as history there).

Ground rules:
1. **The server owns all state.** Clients render state and POST intent;
   they never infer transitions. If the API rejects it, it's impossible.
2. **The platform touches zero money in the pilot** (decisions.md D12:
   Helper Collateral + Advance Direct UPI).
3. All API paths below are relative to `https://<API>/api/`. Auth header:
   `Authorization: Token <token>` (DRF token), except where marked public.

---

## 1. Actors

| Actor | How they're created | What they do |
|---|---|---|
| **Customer** | Google sign-in (or register) with `role: "customer"` | Posts errand requests, approves prices, pays helper directly in advance, shows the OTP |
| **Helper** | Same, `role: "helper"` | Deposits refundable collateral (₹200), browses feed, accepts, uploads price evidence, confirms payment received, shops, enters the OTP |
| **Founder/admin** | `ensure_admin` command | `/app/admin` staff console & Django `/admin/`: disputes, collateral balances, trust thresholds, OTP unlocks |

One account = one role, chosen at sign-up. A person who wants both makes
two accounts (two roll emails is impossible by design — one email = one
account).

## 2. Auth (Google-first)

**Primary: Google sign-in.** SASTRA email is Google Workspace, so every
student already has a Google account on their roll address
(`<roll>@sastra.ac.in`).

1. Client runs the Google sign-in flow, obtains an **ID token** (JWT).
2. `POST /api/auth/google/` `{ "id_token": "..." }` (public).
3. Server verifies the token against Google's certs, requires
   `email_verified` and the hosted domain `hd == sastra.ac.in`
   (`COLLEGE_EMAIL_DOMAINS`). A verified Google sign-in **is** student
   verification — the account is born `is_verified_student: true`.
4. Response: `{ token, user }` — first-time sign-ins get the account
   created from the Google profile (role from the request body).

Fallback (kept working, not the primary UX): password register/login
(`auth/register/`, `auth/login/`) with email-link verification
(`auth/verify/`, `auth/resend-verification/`).

Profile: `GET/PATCH /api/me/` — `upi_id` (helpers must set this to get
paid), `hostel_block`, `pickup_point`, `collateral_balance`.

## 3. The order lifecycle (the spine)

States: `open → accepted → purchased → handed_over → completed`
(+ terminal `cancelled`). Full transition table: `state-machine.md`.

| # | Actor | Screen action | API call | Resulting state |
|---|---|---|---|---|
| 1 | Customer | Post errand: items (name, qty, expected price), `needed_by`, `pickup_point` | `POST /api/requests/create/` | `open` |
| 2 | Helper | Browse feed of open requests (only if collateral $\ge$ estimated total) | `GET /api/feed/` | — |
| 3 | Helper | Accept | `POST /api/requests/<id>/accept/` | `accepted` — atomic lock; loser gets 409 |
| 4 | Helper | Per item: propose actual price **with a shelf/receipt photo** | photo: §5, then `POST /api/requests/<id>/items/<item_id>/propose-price/` | `accepted`, prices `pending` |
| 5 | Customer | See photos + prices, approve (or reject → helper revises) | `POST .../items/<item_id>/approve-price/` | all items approved → order payable |
| 6 | Customer | **Pay helper advance directly (D12)**: when all items are approved, server posts a **payment card message into order chat**. Customer taps **"Pay in UPI App"** (opens native app chooser: FamPay, GPay, PhonePe, Paytm) or scans the dynamic QR. Customer taps "I've Sent Payment" | `POST /api/orders/<id>/pay/` | payment `pending` |
| 7 | Helper | Verifies credit in their UPI app, taps "Confirm Receipt" (money is in hand; helper never fronts cash) | `POST /api/orders/<id>/confirm-payment/` | payment `held` (collateral-guarded) |
| 8 | Helper | Shop using customer's advance money, then mark purchased — **the OTP is born here** | `POST /api/requests/<id>/mark-purchased/` | `purchased` |
| 9 | Customer | Meet the helper, **show** the 4-digit OTP (rendered only to the customer) | `GET /api/requests/<id>/` | — |
| 10 | Helper | Enter the OTP | `POST /api/requests/<id>/confirm-handover/` `{code}` | `handed_over → completed`, payment `released`, collateral uncommitted |

Rules the backend enforces (clients must respect, never duplicate):
- Helper must hold active uncommitted collateral $\ge$ order item cost to accept.
- Exactly one helper can accept (guarded write; race loser sees 409).
- `held` payment (advance confirmed received by helper) is the hard gate for
  `mark-purchased`. The helper buys only after receiving customer advance funds.
- If a helper confirms payment and ghosts, customer is reimbursed from the
  helper's collateral deposit, and helper's student account is banned (D12).
- Handover OTP: Wrong OTP × 5 → handover endpoint locks; admin unlocks.
- Payment timeout: no payment within `PAYMENT_TIMEOUT_MINUTES` (30) of
  price approval → order auto-returns to `open`, helper cleared, both
  notified (sweep runs on feed reads).
- Cancellation: customer cancels free before `purchased`; after that it's
  a dispute (helper-agreement path). Cancels and flakes feed the trust
  system (§7).
- Zero commission in pilot (`PLATFORM_CUT_PER_ORDER=0`).

## 4. Chat (per order, both participants)

`GET/POST /api/orders/<id>/messages/`. Text and **image attachments** use
the Cloudinary direct upload pipe (§5). Chat exists from `accepted` onward;
it is the coordination surface. **Chat is the center of the order UI**:
state changes surface as cards in the thread, and the payment moment lives
here too — a server-posted **payment card** message (type `payment_card`)
appears when prices are approved (§3 step 6).

**Payment card payload (D12: Advance UPI mode).** The card arrives as
a chat message with `isSystemNotice: true` and a `card` object:

```json
{
  "type": "payment_card",
  "orderId": 14,
  "payMode": "advance_upi",
  "upiId": "helper@okhdfcbank",
  "helperName": "S K Parthiv",
  "itemCost": 95,
  "helperFee": 20,
  "total": 115,
  "currency": "INR",
  "upiDeepLink": "upi://pay?pa=helper@okhdfcbank&pn=S%20K%20Parthiv&am=115.00&cu=INR&tn=NeedIt%20Order%2314",
  "note": "Need It order #14"
}
```

- `payMode: "advance_upi"`:
  - Universal UPI Intent (`upiDeepLink`): The client renders a prominent **"Pay ₹115 in UPI App"** button that invokes the OS application chooser directly into **FamPay, Google Pay, PhonePe, Paytm, or CRED** with payee and amount pre-filled.
  - Dynamic QR Code: Rendered client-side from `upiDeepLink` for desktop/laptop customers scanning with a phone.
  - 1-Click Copy: Helper's UPI ID (`upiId`) can be copied to clipboard as a manual fallback.
  - Confirmation states: Customer taps *"I've Sent Payment"*, Helper taps *"Confirm Payment Received"*. Once both attest, payment flips to `held` under collateral guard, unlocking `mark-purchased`.
- A repriced re-approval posts a fresh card — **the latest card wins**. If the helper has no `upi_id`, a plain warning card is displayed prompting the helper to set their UPI ID in profile before payment can proceed.

## 5. Photos (Cloudinary, direct upload)

Our API **never proxies image bytes**. Flow for any photo (price evidence,
chat attachment):

1. `GET /api/uploads/signature/` (auth) → `{ signature, timestamp, api_key,
   cloud_name, folder }`.
2. Client uploads the file **directly to Cloudinary** with those params.
3. Client stores/posts only the returned **URL** (e.g. `evidencePhotoUrl`
   on the item, or a chat attachment).

If Cloudinary keys aren't configured, the signature endpoint answers 503 —
clients should hide photo buttons and let flows continue without photos.
Works identically on mobile (camera) and web (file picker).

## 6. Notifications

`GET /api/notifications/` · `POST /api/notifications/<id>/read/`.
Events emitted at: accepted, price proposed/approved, payment confirmed,
purchased, handover completed, item-unavailable, order auto-released,
cancel. Poll on screen focus; FCM push is post-pilot.

## 7. Trust system (v1)

Two mechanisms, one goal: bad actors lose access, automatically and
transparently.

**Ratings (both directions).** After `completed`, customer rates helper
and helper rates customer (1–5 + optional note) via
`POST /api/orders/<id>/rate/`. Ratings are reputation data — displayed,
averaged, never the block trigger.

**Problem counts (the block trigger).** A *problem* = a confirmed report
against you, or a flake event (helper releasing after price approval,
post-accept cancellation). Reports: `POST /api/reports/`; admins confirm
or dismiss in `/admin/`. When your confirmed-problem count crosses the
threshold, you're **blocked**: helpers can't accept, customers can't post
(403 with reason + appeal path via report thread).

**Thresholds are admin-tunable, not constants** — a `TrustPolicy` row
edited in `/admin/` (e.g. helper block at 3 problems, customer block at 3,
min orders before enforcement 1). The pilot's job is to find the sweet
spot; expect these numbers to move. Admins can always unblock manually.

**Helper Collateral (the advance-payment guard, D12).** Helpers maintain a
refundable security balance (₹200). A helper can only accept an order if
`uncommitted_collateral >= estimated_total`. If a helper receives customer
advance money and absconds/ghosts, the customer is immediately reimbursed
from this collateral, and the helper's verified SASTRA student account is
permanently banned and reported to campus authorities.

## 8. What NOT to build (pilot)

- **No payment-gateway / merchant-of-record UI.** Payment is direct advance
  UPI via universal deep link or dynamic QR (D12).
- **No unauthenticated dev backdoors or admin bypasses** (PR #33). Mobile
  founder operations use the authenticated `/app/admin` staff view, strictly
  gated by Django's `user.is_staff` check (D13).
- **No AI runtime execution in pilot.** Errand data is de-identified and logged
  for post-pilot dataset training only (D14, see `docs/ai-roadmap.md`).
- No email-verification UI as the primary path (Google sign-in covers it).
- No shops module, no parcel-desk staffing, no COD.

## 9. Client surfaces

| Surface | Stack | Scope |
|---|---|---|
| Mobile app (primary) | Expo / React Native (`apps/mobile/`) | Everything above |
| Web | Vite + React (`web/`) | Same API; photos via file picker; company pages are static |

Same API, same states, same rules. Any client-specific divergence is a
bug against this document.

## 10. Status vocabulary (exact strings)

Order: `open accepted purchased handed_over completed cancelled` ·
Payment: `none pending held released failed refunded` ·
Price approval: `pending approved rejected` ·
Report: `open confirmed dismissed` ·
Rating: integer 1–5.
