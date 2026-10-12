# API Reference

Base URL: `/api/`. Auth: `Authorization: Token <key>` on every endpoint
except register/login/verify. JSON in, JSON out. Errors are
`{"detail": "..."}` with a 4xx status.

`GET /api/health/` is unauthenticated and returns `status`, deployed `version`,
database status, and a timestamp. Every response includes an `X-Request-ID`
header; include it when reporting a production failure.

Status vocabulary (exact strings, shared with the clients):
`open → accepted → purchased → handed_over → completed`, plus `cancelled`.
Payment: `none → pending → held → released`, plus `failed`, `refunded`.

## Auth & profile

| Method | Path | Who | Body → Response |
| --- | --- | --- | --- |
| POST | `auth/register/` | anyone | `{email, password, role, policy_accept:true}` → `{user}` + (`verification_token` in pilot mode, or `detail:"Verification email sent."`) |
| GET | `auth/verify/?token=` | anyone | one-click link from the email → HTML page |
| POST | `auth/verify-email/` | anyone | `{token}` → `{user}` (is_verified_student=true) |
| POST | `auth/login/` | anyone | `{email, password}` → `{token, user}` |
| POST | `auth/logout/` | authed | — → 204, token destroyed |
| GET | `me/` | authed | — → `{user}` |

Emails must match `COLLEGE_EMAIL_DOMAINS` (sastra.ac.in in production).

## Orders

| Method | Path | Who | Effect |
| --- | --- | --- | --- |
| GET | `feed/` | helper | open orders; also sweeps stale accepted (>30 min unpaid → back to open) |
| GET | `requests/` | authed | my orders (as customer or helper) |
| POST | `requests/create/` | customer | `{neededBy, pickupPoint, expectedTotal, isUrgent?, items:[{name, quantity, expectedPrice, notes?, alternativesAllowed?}]}` → `{request}` |
| GET | `requests/<id>/` | participant | order detail with items + history |
| POST | `requests/<id>/accept/` | helper | atomic lock; 409 if taken |
| POST | `requests/<id>/items/<item_id>/propose-price/` | helper | `{actualPrice}` per item |
| POST | `requests/<id>/approve-price/` | customer | approves all proposed prices |
| POST | `requests/<id>/items/<item_id>/unavailable/` | helper | marks item unavailable (excluded from charge) |
| POST | `requests/<id>/items/<item_id>/replacement/` | helper | `{replacementProposal}` |
| POST | `requests/<id>/items/<item_id>/approve-replacement/` | customer | accepts replacement |
| POST | `requests/<id>/mark-purchased/` | helper | **gated: payment must be `held` + all prices approved** |
| POST | `requests/<id>/confirm-handover/` | both | double one-time-code; second confirm → `completed` + payment `released` |
| POST | `requests/<id>/cancel/` | participant | refunds pending/held payment; post-purchase needs helper agreement |
| POST | `requests/<id>/release/` | — | legacy manual release; the handover path releases automatically |

## Payments

| Method | Path | Who | Body → Response |
| --- | --- | --- | --- |
| GET | `orders/<id>/payment-status/` | participant | — → `{status, item_cost, helper_fee, total}` |
| POST | `orders/<id>/pay/` | customer | `{helperFee}` (₹20–50) → `{status:"pending", total}`. Requires accepted order + all available items price-approved. Idempotent. |
| POST | `orders/<id>/confirm-payment/` | both | each side confirms the UPI transfer; when both have → `held` |
| POST | `webhooks/payment/` | Razorpay only | signature-verified, event-id deduped; inactive in pilot |

## Chat

| Method | Path | Who | Body |
| --- | --- | --- | --- |
| GET/POST | `orders/<id>/messages/` | participant | GET list / POST `{text, photoUrl?}` |

## Notifications

| Method | Path | Effect |
| --- | --- | --- |
| GET | `notifications/` | my notifications (types: accepted, item_unavailable, price_change, ready_for_pickup, completed, broadcast) |
| POST | `notifications/<id>/read/` | mark one read |
| POST | `notifications/read-all/` | mark all read |

## Availability (helpers)

| Method | Path | Body |
| --- | --- | --- |
| GET | `availability/` | my windows |
| POST | `availability/add/` | `{date:"YYYY-MM-DD", startTime, endTime}` |
| DELETE | `availability/<id>/` | owner only |

## Reports

| Method | Path | Who | Body |
| --- | --- | --- | --- |
| POST | `reports/file/` | order participant | `{orderId, reason, details?}` |
| GET | `reports/` | authed | my filed reports |

Resolution is manual by founders in `/admin/` — there is no automated
punishment pipeline in v1.
