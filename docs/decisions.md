# Decisions register (ADRs)

One page per decision that cost us something to make. Newest first. When a
decision is replaced, the old entry stays — struck through, pointing at its
successor — because the reasoning is the valuable part.

---

## D9 — Pilot money v2: merchant of record via Razorpay payment links (2026-10-14)

**Decision:** The platform **collects** the customer's payment (merchant of
record on a BASE Razorpay account — payment links into the platform's bank
account). Flow: helper accepts → helper reaches the shop and posts price
evidence photos → customer approves prices → customer pays the secure link
(item cost + chosen fee) → **only then** the helper buys → OTP handover →
payment flips to released → founder settles the helper's payout manually
(UPI, UTR recorded) from the payout console. The ONLY thing that marks a
payment `held` is Razorpay's signed webhook — the app never takes the
customer's word for it. Supersedes D7's "platform touches zero money" for
the pilot. `PAYMENT_PROVIDER=razorpay_base` on Render; `manual`
(direct-UPI) stays as the demo/fallback provider.

**Why the reversal:** D7's direct-UPI pilot had no money-side leverage — a
paid-but-ghosts helper left the customer with only social recourse, and
"helper never fronts cash" rested on the helper honestly confirming
receipt. Merchant of record makes both structural: money is provably in
before the helper spends a rupee, and the OTP is what unlocks the helper's
payout. Razorpay Route (true splits) remains RBI turnover-gated (D4) — a
base account collecting into our own bank account is the legal mode until
then, and manual UPI settlement is what founders already do informally.

**Cost:** (1) Founder becomes the payout desk — every completed order is a
manual UPI settlement with a UTR (the console makes it one screen).
(2) Gateway fee (~2%) is absorbed by the platform in pilot —
`PLATFORM_CUT_PER_ORDER=0` on Render; the flat ₹2 cut built into the payout
ledger is a one-line env flip when volume justifies it. (3) Refunds on
cancel-after-payment are manual (Razorpay dashboard). (4) New ops surface:
webhook URL + secret, key rotation.

**What did NOT change:** the order/payment state machines (states are
identical — only WHO holds the money changed), the held-before-purchase
gate, the OTP handover, the trust system.

---

## D8 — "Ask NEEDIT" AI assistant: deferred to post-pilot (2026-10-14)

**Decision:** The Gemini-based campus assistant (PR #33, closed unmerged)
is **not in the pilot**. The architecture that was proposed is recorded so
the post-pilot build doesn't re-litigate it: client-side Firebase AI Logic
(browser → Gemini Developer API directly, no backend proxy), Firebase
client key gated by App Check + reCAPTCHA Enterprise, model name in env,
system prompt tuned to campus rules (veg-only, 13 delivery spots, fee
range, photo/UPI/OTP security model). The backend is untouched by design.

**Why deferred:** (1) no usage data to evaluate or tune against — shipping
an LLM feature with zero evals is guessing; (2) a third platform console
(Firebase project + App Check + reCAPTCHA) joins a pilot stack that just
got *simpler* (D7); (3) prompt-injection and hallucinated-campus-facts
surface with no moderation budget; (4) the pilot spine (auth → order →
chat → pay → OTP handover) isn't live-tested end-to-end yet — that comes
first. The pilot's Q&A need is covered by the pinned FAQ.

**Revisit when:** pilot has real order volume and ≥50 real "would have
asked the AI" questions collected from the report thread / support chat —
that corpus is the eval set. Then ship it exactly as designed above
(client-side, App-Check-gated, zero backend surface).

---

## ~~D7 — Pilot money: direct UPI customer→helper, no commission yet (2026-10-12)~~ → superseded by D9 (merchant of record)

**Decision:** The pilot platform touches **zero money**. After price
approval, the customer pays the helper directly (UPI QR rendered from the
helper's `upi_id`); the helper confirms receipt, then shops. No Razorpay,
no KYC, no commission in v1. The planned commission (flat ₹2 per order,
charged to the *helper* via Razorpay) is deferred to a post-pilot launch —
it reuses the existing provider seam (`RazorpayBaseProvider`, PR #22).
Supersedes the collection half of D3 for the pilot; the OTP handover and
payout ledger stay.

**Why:** RBI rules price gateway escrow out of reach (D4), and collecting
order money through the platform adds KYC, webhooks, and refund handling to
a launch that needs none of them. Direct UPI matches how students already
pay each other, costs ₹0, and the helper-confirms-before-shopping step
keeps "helpers never front cash" true without any platform in the middle.

**Cost:** The platform has no money-side leverage — a helper paid-but-ghosts
case has no refund rail. Enforcement is entirely social: the trust system
(problem-count blocks, admin-tunable thresholds). Accepted consciously for
pilot scale; revisit at commission launch.

---

## D6 — Email provider: SendGrid, not Brevo (2026-10-12)

**Decision:** Verification emails go through SendGrid's HTTP API
(`SENDGRID_API_KEY`, 100/day free, single-sender Gmail verification). The
Brevo branch stays in settings as a fallback, but the default and the docs
point at SendGrid.

**Why:** First production deploy: Brevo risk-flagged the account (signup
from a shared campus IP) and applied a **mandatory IP allowlist to API
keys** — every call 401'd, and Render free's egress IPs are dynamic so they
can never be allowlisted. An IP-restricted email key and a Render-hosted app
are structurally incompatible. SendGrid has no such restriction on free.

**Cost:** 100/day vs Brevo's 300/day — a 200-user launch spreads across two
evenings instead of one. Acceptable.

---

## D5 — Handover proof is a customer-shown OTP, helper-entered (2026-10-12)

**Decision:** A 4-digit OTP is born at `mark_purchased`. It renders in the API
**only to the customer**. The helper completes the handover by entering that
code; the server judges it (constant-time compare, 5 wrong attempts lock the
endpoint, founder unlocks via `/admin/`). A correct code is one guarded
transition: `purchased → handed_over`, payment released, order completed,
payout created.

**Why:** Single attestation beats the old double-confirm (both sides POST a
shared code) because it maps to the physical reality: the code crossing the
room IS the items crossing the room. It also matches the Rapido/Swiggy
pattern every Indian student already knows.

**Cost:** A customer who never shows the code blocks completion — by design;
that's the dispute path, not a bug.

---

## D4 — Price approval is evidence-based; photos go straight to Cloudinary (2026-10-12)

**Decision:** The helper attaches a shelf/receipt photo when proposing an
item price (`evidencePhotoUrl`); the customer approves prices they can see.
Uploads are browser→Cloudinary with a short-lived server signature — the API
never proxies bytes. `propose-price` only accepts URLs under our
`res.cloudinary.com/<cloud>` prefix; a foreign URL is not evidence.

**Why:** "The price changed, trust me" is where campus errands go to die.
Photo evidence makes approval a 2-second glance instead of an argument.
Signed direct uploads keep storage/bandwidth on Cloudinary's free tier.

**Cost:** Without `CLOUDINARY_*` env vars the feature is off (signature
endpoint 503s) and prices still work — degradation is graceful by design.

---

## D3 — Money: Merchant of Record on a base Razorpay account (2026-10-12)

**Decision:** The platform collects the customer's payment (Razorpay Payment
Link per order, `PAYMENT_PROVIDER=razorpay_base`) into the platform's bank
account, and owes the helper a payout settled by founders (admin console,
UPI deep link, UTR recorded). Platform cut: **₹2 flat per order**, clamped to
the helper fee.

**Trust model:** only the signed webhook (`payment_link.paid`, HMAC-SHA256,
event-id deduped) marks money `held`. Release at handover is a ledger flip —
the money is already ours. Refunds mirror capture state (`pending` = local
flip, `held` = gateway refund).

**Why not Route (true gateway escrow):** RBI's Sept 2025 PA guidelines
require ₹40L domestic turnover (GST-3B) or ₹5L export for marketplace
settlement products — enforced Jan 1 2026, every licensed aggregator. A
zero-revenue pilot cannot legally have gateway escrow. A **base** account
(collect to one bank account) is available to us as individuals
(PAN + Aadhaar + savings, ~3-4 working days).

**Supersedes:** the PRD's escrow chapter and the manual-UPI double-confirm
pilot. `ManualUPIProvider` remains for demos and as the zero-dependency
default; Route stubs remain as the marked seam for the ₹40L future.

**Cost:** We are the merchant of record — refunds, disputes, and the money's
paper trail are our problem now. That's the price of collecting legally.

---

## D2 — Deploy: Render free + Neon free + Cloudflare Pages (2026-10-11)

**Decision:** API on Render free (750 instance-hrs/mo, sleeps after 15 min
idle — warm before demos), Postgres on Neon free (0.5 GB, SSL required),
static web on Cloudflare Pages. ~~Email via Brevo HTTP API (300/day free)~~
→ superseded by D6 (SendGrid). Render free **blocks outbound SMTP**, so
Gmail SMTP would have silently failed. ₹0, no card.

**Why over Fly/Railway:** Railway = $5 trial then ~$1/mo credit (dies in
days); Fly has no free tier at all (7-day trial, card required after).
Render is the only real ongoing free tier.

**Cost:** Cold starts. Mitigation: UptimeRobot pings `/api/health/`; upgrade
path is Render Starter ($7) or the Oracle Always Free VM + Docker Compose.

---

## D1 — No Celery/Redis in the pilot (2026-10-11)

**Decision:** The Celery scaffold (zero tasks wired) was deleted. The one
periodic job — returning stale accepted-unpaid orders to the feed — runs as a
lazy sweep on every feed read (`sweep_stale_accepted`).

**Why:** A broker + worker is two more free-tier services to babysit for a
job that fits in a 5-line query at read time.

**Revisit when:** push notifications (FCM fan-out) or anything genuinely
background arrives — that's a real queue's job.
