# Need It — Backend Build Plan (Orchestrator-Ready)

**How to use this:** hand this to an orchestrator model. Each phase is small,
independent, and produces reviewable files/snippets. The orchestrator dispatches
each TASK to a local code-gen model, then integrates. Do NOT skip the
"Data Contract" — it is the source of truth derived from the actual frontend
code, and every model/serializer must match it.

**North star:** the backend owns the order state machine and the escrow. The app
renders state; only the backend decides it. Every write is a guarded DB update.

---

## 0. Data Contract (derived from frontend `src/types/index.ts`)

These are the entities the app actually renders. Field names use the frontend's
camelCase; serializers map snake_case DB → camelCase JSON.

**Order** (core): id, customerName, customerAlias, customerHostel, pickupPoint,
items[], category, sizeTag, neededBy, isUrgent, isWaitingLong, suggestedStore,
helperFee, itemCost, totalCost, status, createdAt, helperId, helperName,
handoverCode, cancellationReason, ratingGiven, ratingFeedback

**OrderItem**: id, name, quantity, expectedPrice, actualPrice, notes, category,
status(pending|found|unavailable|replaced), replacementProposal{name,price,photoUrl,reason,approved}

**ChatMessage**: id, senderRole, senderName, text, photoUrl, qrCodeUrl, timestamp, isSystemNotice
**ChatConversation**: id, orderId, counterpartName, counterpartRole, lastMessage, lastMessageTime, unreadCount, messages[], isReadOnly
**AppNotification**: id, title, message, timestamp, read, orderId, type(accepted|item_unavailable|price_change|ready_for_pickup|completed|broadcast)
**Shop**: id, name, location, distance, rating, reviewCount, categories[], popularItems[], verifiedByClub, submittedByHelper
**ClubReport**: id, orderReference, reporterName, reporterRole, issueType, details, photoUrl, priority, status(Open|Investigating|Resolved), createdAt, timeline[]
**AvailabilityWindow**: id, date, timeWindow, preset, status
**CampusUser**: id, name, collegeEmail, hostelBlock, role, isVerified, status, ordersCount, joinedDate

**API surface the app already expects** (from `context/AppContext.tsx`):
addOrder, updateOrderStatus, getOrderById, getChatByOrderId, sendMessage,
addAvailability, deleteAvailability, addShop, updateReportStatus, markNotificationRead.

---

## 1. Storage / free-tier analysis — what to cut

**Constraint:** free-tier DB (~500 MB–1 GB Postgres on Neon/Supabase/Railway),
light server (AWS free tier or Railway/Render free). So: store less, compute
more, never store what you can derive.

### DROP — do not store (derive or remove)
| Field / entity | Why drop | What to do instead |
|---|---|---|
| `Shop.rating`, `reviewCount`, `popularItems`, `distance` | Out of PRD scope; reviews need their own tables + writes | Store Shop as name + categories only; drop the rest |
| `ClubReport.timeline[]` | Event-sourced admin audit = rows per action | Single `status` + `resolved_at`; manual resolution (PRD §16) |
| `CampusUser.ordersCount` | Derived | `COUNT` query, never a column |
| `Order.isWaitingLong` | Derived | compute `now - createdAt > threshold` in serializer |
| `Order.customerAlias` | Derived | hash of user id, computed |
| `AvailabilityWindow.preset` | UI label | derive from date/timeWindow at read |
| `ChatMessage.qrCodeUrl` | Part of the direct-QR flow we are replacing with escrow | remove with the payment-model fix |
| **AskNeedit** (whole feature) | Not in PRD | cut entirely — no tables, no endpoints |

### KEEP — but keep light
| Field | Why keep | How to keep light |
|---|---|---|
| `Order.ratingGiven` + `ratingFeedback` | PRD §15 optional rating, one number + short text | two columns on Order, NOT a separate reviews table |
| `Order.cancellationReason` | needed for disputes | one short text column |
| `Order.category`, `sizeTag`, `suggestedStore` | shown in feed/detail | short enums/text |
| `AppNotification` | PRD §8 must notify | one table, but **prune rows older than 30 days** (Celery beat) |
| `StatusChange` audit | escrow trust | append-only but tiny (ids + 2 enums); prune > 90 days |
| `ChatMessage.photoUrl` | PRD §9 photos | **store in S3-compatible object storage, DB holds only the URL.** Never blob images into Postgres |

### The two rules that keep the free tier alive
1. **Photos never touch Postgres.** Upload to S3-compatible storage (Cloudflare R2 free tier, or Backblaze B2 free 10 GB); DB stores the URL string only.
2. **Prune aggressively.** Celery-beat jobs delete old notifications (30 d) and old audit rows (90 d). A campus pilot generates little data; pruning keeps it that way.

### Recommended free stack
Neon (Postgres, free 0.5 GB) **or** Supabase free · Cloudflare R2 (photos, free)
· Render/Railway free web service (Django + gunicorn) · Upstash Redis free
(Celery broker) · FCM free (push). All free, all swappable via `.env`.

---

## 2. Phases (small, ordered, each independently reviewable)

Already done & tested (do not regenerate): `config/`, `apps/orders` state
machine, `apps/payments` escrow abstraction, `apps/users` model, `apps/chat`
model, escrow invariant tests.

### PHASE 1 — Auth & Users (foundation)
- **1.1** `users/serializers.py`: RegisterSerializer (college email, password, role, policy_accept). Validate email domain allowlist.
- **1.2** `users/views.py`: `register`, `verify_email` (signed token), `login` (return DRF token), `logout`, `me`.
- **1.3** Email verification token: use `django.core.signing` (no extra table). Unverified → read-only permission class `IsVerifiedStudent`.
- **1.4** Wire `users/urls.py`. Tests: register→verify→login flow; unverified cannot post.
- *Out:* working token auth, no cookies/CSRF.

### PHASE 2 — Requests & Feed (customer core)
- **2.1** `orders/serializers.py`: RequestSerializer + nested RequestItemSerializer. Map to Data Contract field names.
- **2.2** `create_request` view: validate items, **block prohibited items server-side** (list from settings), default status `open`.
- **2.3** `feed` view: only `status=open`, hide locked/completed, ordered by neededBy.
- **2.4** `my_requests`, `get_request` (detail with items + status). Prohibited-items tests.
- *Out:* a customer can post and see requests; helpers see the feed.

### PHASE 3 — Accept / Release / Locking (the concurrency-critical part)
- **3.1** Accept endpoint → `services.accept` (already guarded). Return 409 on conflict.
- **3.2** Release endpoint → `services.release`.
- **3.3** `cancel` endpoint with role rules (customer pre-purchase free; post-purchase needs helper agree).
- **3.4** Tests: two-helper race (done), release-to-feed, cancel rules.
- *Out:* locking works; only one helper ever wins.

### PHASE 4 — Price confirmation & Items (pre-payment)
- **4.1** `propose_price` (helper sets actualPrice per item) + `approve_price` (customer) endpoints.
- **4.2** `mark_unavailable` + `propose_replacement` (photo) + `approve_replacement`.
- **4.3** Rule enforced: no purchase until price approved. Tests for price gate + replacement flow.
- *Out:* the exact amount is agreed before any money moves.

### PHASE 5 — Escrow Payments (the core)
- **5.1** `pay` endpoint: create Payment with **actual** confirmed total (never expectedTotal), idempotency_key = order id.
- **5.2** ManualUPIProvider already marks HELD on confirm; add `confirm_payment` endpoint (both sides).
- **5.3** Release-on-handover trigger + Celery task `release_payment_after_handover`.
- **5.4** Celery-beat `payment_timeout` → auto-release order to feed (PRD edge case).
- **5.5** Tests: escrow gate (done), idempotent release (done), timeout auto-release.
- *Out:* money held gates purchase; release is mechanical.

### PHASE 6 — Handover & Completion
- **6.1** `handover_code` generation (one-time, short code on Order).
- **6.2** `confirm_handover` (both sides) → triggers payment release → settlement → `complete`.
- **6.3** Optional `ratingGiven` + `ratingFeedback` on complete. Tests: double-confirm flow.
- *Out:* the trust moment, end to end.

### PHASE 7 — Chat
- **7.1** `list_messages` (polling), `send_message` (text + photo).
- **7.2** Photo upload → S3-compatible storage, DB stores URL.
- **7.3** Read-only when order completed (permission check). Tests: post-completed chat rejected.
- *Out:* in-app chat, numbers hidden, photos in object storage.

### PHASE 8 — Notifications
- **8.1** Notification model + `list`, `mark_read` endpoints.
- **8.2** Emit on the PRD events: accepted, item_unavailable, price_change, ready_for_pickup, completed.
- **8.3** Celery-beat prune > 30 days. FCM push stub (key in `.env`).
- *Out:* in-app notifications; push ready when key lands.

### PHASE 9 — Availability (helper, SHOULD)
- **9.1** AvailabilityWindow model + `add`, `delete`, `list`.
- **9.2** Match feed to active windows (nice-to-have). Light tests.

### PHASE 10 — Reports / Trust & Safety
- **10.1** ClubReport model: order ref, reporter, issueType, details, photoUrl, priority, status. NO timeline[] (dropped per §1).
- **10.2** `report_problem` endpoint; Django admin for manual resolution.
- *Out:* report button works, admin resolves manually.

### PHASE 11 — Shops (light)
- **11.1** Shop model: name, categories only (drop rating/reviewCount/popularItems per §1).
- **11.2** `list_shops`, `add_shop` (helper-submitted).

### PHASE 12 — Deploy & Harden
- **12.1** Dockerfile / `render.yaml`. gunicorn + WhiteNoise.
- **12.2** `.env` for Neon + R2 + Upstash (free tiers).
- **12.3** Celery worker + beat schedule (payment timeout, pruning).
- **12.4** Smoke test against deployed URL.

---

## 3. Orchestrator execution notes
- **One phase → one local-model dispatch → one review.** Don't batch phases.
- Each phase ends with **tests passing** (`python manage.py test`) before the next.
- Generated code must match the Data Contract field names exactly (serializers handle snake↔camel).
- The orchestrator integrates snippets into the existing apps; it does not let the local model invent new apps or rename the status vocabulary.
- Free-tier guardrails (§1) are acceptance criteria: no image blobs in DB, pruning jobs present, dropped fields stay dropped.
