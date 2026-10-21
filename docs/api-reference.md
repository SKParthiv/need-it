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
| POST | `auth/register/` | anyone | `{email, password, role, policy_accept:true}` → 201 `{user}` + (`verification_token` in pilot mode, or `{email_sent:true}`. If the provider fails: still 201, `{email_sent:false}` — the account exists, never a 500) |
| POST | `auth/google/` | anyone | **Primary sign-in.** `{id_token, role?}` → `{token, user}`. Verifies the Google token server-side (signature + audience + `email_verified` + Workspace `hd` ∈ `COLLEGE_EMAIL_DOMAINS`); account is born `is_verified_student:true`. `role` required on first sign-in only. 503 when `GOOGLE_CLIENT_ID` unset |
| POST | `auth/resend-verification/` | anyone | `{email}` → fresh link. Generic 200 for unknown/verified emails (no enumeration); `{verification_token}` in pilot mode; honest 503 if the provider is down |
| GET | `auth/verify/?token=` | anyone | one-click link from the email → HTML page |
| POST | `auth/verify-email/` | anyone | `{token}` → `{user}` (is_verified_student=true) |
| POST | `auth/login/` | anyone | `{email, password}` → `{token, user}` |
| POST | `auth/logout/` | authed | — → 204, token destroyed |
| GET | `me/` | authed | — → `{user}` incl. trust summary (`problems`, `blocked`) |

Emails must match `COLLEGE_EMAIL_DOMAINS` (sastra.ac.in in production).

## Orders

| Method | Path | Who | Effect |
| --- | --- | --- | --- |
| GET | `feed/` | helper | open orders; also sweeps stale accepted (>30 min unpaid → back to open) |
| GET | `requests/` | authed | my orders (as customer or helper) |
| POST | `requests/create/` | customer | `{neededBy, pickupPoint, expectedTotal, isUrgent?, items:[{name, quantity, expectedPrice, notes?, alternativesAllowed?}]}` → `{request}` |
| GET | `requests/<id>/` | participant | order detail with items + history |
| POST | `requests/<id>/accept/` | helper | atomic lock; 409 if taken |
| POST | `requests/<id>/items/<item_id>/propose-price/` | helper | `{actualPrice, evidencePhotoUrl?}` — photo must be a `res.cloudinary.com/<our-cloud>` URL (proof it went through our signed upload) |
| POST | `requests/<id>/approve-price/` | customer | approves all proposed prices |
| POST | `requests/<id>/items/<item_id>/unavailable/` | helper | marks item unavailable (excluded from charge) |
| POST | `requests/<id>/items/<item_id>/replacement/` | helper | `{replacementProposal}` |
| POST | `requests/<id>/items/<item_id>/approve-replacement/` | customer | accepts replacement |
| GET | `uploads/signature/` | any verified | one signed direct→Cloudinary upload params (`cloudName`, `apiKey`, `timestamp`, `folder`, `signature`); **503 when unconfigured** |
| POST | `requests/<id>/mark-purchased/` | helper | **gated: payment must be `held` + all prices approved** |
| POST | `requests/<id>/confirm-handover/` | helper | `{code}` — the customer's 4-digit OTP; correct → `completed` + payment `released` + payout created. Wrong codes counted, locks after 5 |
| POST | `requests/<id>/cancel/` | participant | refunds pending/held payment; post-purchase needs helper agreement |
| POST | `requests/<id>/release/` | — | legacy manual release; the handover path releases automatically |

## Payments (D12: Advance Direct UPI)

| Method | Path | Who | Body → Response |
| --- | --- | --- | --- |
| GET | `orders/<id>/payment-status/` | participant | — → `{status, item_cost, helper_fee, total, provider, upi_deep_link?}` |
| POST | `orders/<id>/pay/` | customer | `{helperFee}` (₹20–50) → `{status:"pending", total, upi_deep_link}`. In D12 mode, generates the universal `upi://pay` intent link (FamPay/GPay/PhonePe/Paytm) and dynamic QR payload. Idempotent |
| POST | `orders/<id>/confirm-payment/` | both | Customer marks sent; Helper marks confirmed received → `held` (held under collateral guard). Gates `mark-purchased` |

## Helper Collateral & Mobile Admin (D12, D13)

| Method | Path | Who | Body / Effect |
| --- | --- | --- | --- |
| GET | `collateral/` | helper | `{collateral_balance, committed_amount, available_balance}` — guard for accepting open requests |
| GET | `admin/overview/` | staff only | Metrics for `/app/admin` mobile dashboard: live orders, pending reports, active helpers |
| POST | `admin/collateral/<user_id>/record-deposit/` | staff only | `{amount, notes}` — records helper refundable security deposit |
| POST | `admin/collateral/<user_id>/refund/` | staff only | `{amount}` — records security deposit return to helper |

## Dataset & Analytics (D14)

| Command / Tool | Environment | Effect |
| --- | --- | --- |
| `python manage.py export_errand_dataset` | Backend CLI | Dumps privacy-scrubbed, de-identified errand logs (`.parquet` / `.csv`) for Kaggle/AI dataset pipeline per `docs/ai-roadmap.md` |

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

Resolution is manual by founders via `/app/admin` or Django `/admin/`; the blame actions
(resolve against customer/helper) feed the trust problem counts below.

## Trust

| Method | Path | Who | Body |
| --- | --- | --- | --- |
| POST | `orders/<id>/rate/` | order participant, after `completed` | `{stars 1-5, note?}` → 201; one per side per order (409 on repeat) |

Problem counts block automatically: helpers at the threshold can't accept,
customers can't post (403 with reason). Sources: admin-confirmed reports
(blame actions on the Reports admin page) + flakes (helper cancels after
accepting, or lets an accepted order go stale). Thresholds live in
`/admin/` → Trust policy — tune them live during the pilot.
