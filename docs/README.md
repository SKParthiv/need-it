# Need It Docs

The working set. Everything else is in `archive/` (history, not guidance).

| File | What it is |
| --- | --- |
| `userflow-v2.md` | **The product contract** — actors, auth, order spine, photos, trust |
| `state-machine.md` | Order + payment status vocabulary; the server owns it |
| `api-reference.md` | Every endpoint, body, and error |
| `architecture.md` | Stack, invariants, payment seam, **lean-client doctrine + scaling rules** |
| `runbook.md` | Deploy once, then day-2 ops, limits, incidents, demo checklist |
| `local-development.md` | Local setup, tests, LAN testing |
| `decisions.md` | ADR register (D1–D14) — supersedes anything it conflicts with |
| `ai-roadmap.md` | Future AI pipeline — privacy de-identification, Kaggle schema, recommendation models |

Read your lane: **deploy/on-call** → runbook. **building a client** →
userflow-v2 + state-machine + api-reference. **backend** → architecture +
local-development. **deciding product** → decisions. **future AI** → ai-roadmap.
