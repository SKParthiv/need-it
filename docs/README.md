# Need It Docs

## Read your lane

**I want to deploy / I'm on call**
1. `deploy-free-tier.md` — the one-time setup (Neon → Render → Pages)
2. `operations.md` — day-2 runbook: recurring jobs, limits, incidents, demo checklist

**I'm building a client (mobile/web)**
1. **`userflow-v2.md` — THE contract: actors, auth, order spine, photos, trust. Start here.**
2. `state-machine.md` — the status vocabulary
3. `api-reference.md` — every endpoint, body, and error

**I'm new to the backend**
1. `architecture.md` — stack, app map, the 8 invariants
2. `local-development.md` — setup, tests, smoke flow, LAN testing
3. `state-machine.md` + `api-reference.md`

**Founders deciding product**
1. `decisions.md` — the ADR register: what we decided and why (when
   anything and the repo disagree — the register wins)
2. `userflow-v2.md` — the living product contract
3. `TODO.md` — current status + open decisions

## All files

| File | What it is |
| --- | --- |
| `userflow-v2.md` | **The pilot contract** — actors, Google auth, order spine, photos, trust system. AI-first; supersedes the PDFs |
| `architecture.md` | Runtime stack, monorepo map, invariants, payment seam |
| `api-reference.md` | Complete endpoint reference |
| `state-machine.md` | Order/payment status vocabulary contract |
| `deploy-free-tier.md` | One-time production setup (~30 min of clicking) |
| `operations.md` | Runbook: recurring jobs, limits, incidents, demo day |
| `local-development.md` | Local setup, verification, smoke flow, LAN testing |
| `decisions.md` | ADR register — supersedes the PRD where they conflict |
| `PRD-v1.pdf` | ⚠ Historical. Superseded by `userflow-v2.md` + decisions.md |
| `design-brief-v1.pdf` | ⚠ Historical. Superseded by `userflow-v2.md` |
| `userflow-mindmap-v1.html` | ⚠ Historical. Superseded by `userflow-v2.md` |
| `TODO.md` | Status + open founder decisions |
