# Need It — User Flow & Backend Contract (v2, pilot)

**Read this first if you are building any client (mobile app or web).**
This document is written to be machine-readable: every screen action maps
to an exact API call, every state has an exact string, every rule names its
enforcement point. If something here disagrees with the code, the code is
wrong — file it. Supersedes `userflow-mindmap-v1.html`, `PRD-v1.pdf`, and
`design-brief-v1.pdf` (kept as history).

Ground rules:
1. **The server owns all state.** Clients render state and POST intent;
   they never infer transitions. If the API rejects it, it's impossible.
2. **The platform touches zero money in the pilot** (decisions.md D7).
3. All API paths below are relative to `https://<API>/api/`. Auth header:
   `Authorization: Token <token>` (DRF token), except where marked public.

---

## 1. Actors

| Actor | How they're created | What they do |
|---|---|---|
| **Customer** | Google sign-in (or register) with `role: "customer"` | Posts errand requests, approves prices, pays the helper directly, shows the OTP |
| **Helper** | Same, `role: "helper"` | Browses the feed, accepts, uploads price evidence, shops, confirms payment received, enters the OTP |
| **Founder/admin** | `ensure_admin` command | `/admin/` console: reports, trust thresholds, payouts, OTP-lock unlocks |

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
paid), `hostel_block`, `pickup_point`.

## 3. The order lifecycle (the spine)

States: `open → accepted → purchased → handed_over → completed`
(+ terminal `cancelled`). Full transition table: `state-machine.md`.

| # | Actor | Screen action | API call | Resulting state |
|---|---|---|---|---|
| 1 | Customer | Post errand: items (name, qty, expected price), `needed_by`, `pickup_point` | `POST /api/requests/create/` | `open` |
| 2 | Helper | Browse feed of open requests | `GET /api/feed/` | — |
| 3 | Helper | Accept | `POST /api/requests/<id>/accept/` | `accepted` — atomic lock; loser gets 409 |
| 4 | Helper | Per item: propose actual price **with a shelf/receipt photo** | photo: §5, then `POST /api/requests/<id>/items/<item_id>/propose-price/` | `accepted`, prices `pending` |
| 5 | Customer | See photos + prices, approve (or reject → helper revises) | `POST .../items/<item_id>/approve-price/` | all items approved → order payable |
| 6 | Customer | **Pay the helper directly**: when all items are approved, the server posts a **payment card message into the order chat** carrying `upi_id`, the approved total, and a ready-made `upi://` deep link. The customer taps **"Pay in UPI app"** (deep link opens their UPI app with payee + amount pre-filled) or scans the QR rendered from the same payload, then taps "I've paid" | `POST /api/orders/<id>/pay/` | payment `pending` |
| 7 | Helper | Confirm the money actually arrived in their UPI app | `POST /api/orders/<id>/confirm-payment/` | payment `held` |
| 8 | Helper | Shop, then mark purchased — **the OTP is born here** | `POST /api/requests/<id>/mark-purchased/` | `purchased` |
| 9 | Customer | Meet the helper, **show** the 4-digit OTP (rendered only to the customer) | `GET /api/requests/<id>/` | — |
| 10 | Helper | Enter the OTP | `POST /api/requests/<id>/confirm-handover/` `{code}` | `handed_over → completed`, payment `released` |

Rules the backend enforces (clients must respect, never duplicate):
- Exactly one helper can accept (guarded write; race loser sees 409).
- `held` payment is the hard gate for `mark-purchased` — a helper who
  hasn't confirmed receipt cannot proceed. Helpers never front cash.
- Wrong OTP × 5 → handover endpoint locks; admin unlocks in `/admin/`.
- Payment timeout: no payment within `PAYMENT_TIMEOUT_MINUTES` (30) of
  price approval → order auto-returns to `open`, helper cleared, both
  notified (sweep runs on feed reads).
- Cancellation: customer cancels free before `purchased`; after that it's
  a dispute (helper-agreement path). Cancels and flakes feed the trust
  system (§7).

## 4. Chat (per order, both participants)

`GET/POST /api/orders/<id>/messages/`. Text now; **image attachments** use
the same Cloudinary pipe as price evidence (§5) — the client uploads,
then posts the returned URL as the message attachment. Chat exists from
`accepted` onward; it's the coordination surface (shop names, substitutes,
meet point). **Chat is the center of the order UI**: state changes surface
as cards in the thread, and the payment moment lives here too — a
server-posted **payment card** message (type `payment_card`, payload:
`upi_id`, `amount`, `upi_deep_link`) appears when prices are approved
(§3 step 6).

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

## 8. What NOT to build (pilot)

- **No commission, no Razorpay, no payment-gateway UI.** The pay step is
  "scan helper's QR in your own UPI app." (Post-pilot commission: D7.)
- No email-verification UI as the primary path (Google sign-in covers it).
- No shops module, no parcel-desk staffing, no COD.
- No custom admin frontend — the founder uses Django `/admin/`.

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
