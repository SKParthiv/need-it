# Need It Docs

## Read your lane

**I want to deploy / I'm on call**
1. `deploy-free-tier.md` — the one-time setup (Neon → Render → Brevo → Pages)
2. `operations.md` — day-2 runbook: recurring jobs, limits, incidents, demo checklist

**I'm building a client (mobile/web)**
1. `state-machine.md` — the status vocabulary contract
2. `api-reference.md` — every endpoint, body, and error
3. `design-brief-v1.pdf` — screens + what's fixed vs yours (frontend)
4. `userflow-mindmap-v1.html` — the whole product on one page (open in browser)

**I'm new to the backend**
1. `architecture.md` — stack, app map, the 8 invariants
2. `local-development.md` — setup, tests, smoke flow, LAN testing
3. `state-machine.md` + `api-reference.md`

**Founders deciding product**
1. `PRD-v1.pdf` — the product contract
2. `decisions.md` — the ADR register: what we decided and why (read this when
   the PRD and the repo disagree — the register wins)
3. `TODO.md` — current status + open decisions

## All files

| File | What it is |
| --- | --- |
| `architecture.md` | Runtime stack, monorepo map, invariants, payment seam |
| `api-reference.md` | Complete endpoint reference |
| `state-machine.md` | Order/payment status vocabulary contract |
| `deploy-free-tier.md` | One-time production setup (~30 min of clicking) |
| `operations.md` | Runbook: recurring jobs, limits, incidents, demo day |
| `local-development.md` | Local setup, verification, smoke flow, LAN testing |
| `decisions.md` | ADR register — supersedes the PRD where they conflict |
| `PRD-v1.pdf` | Product requirements — the business contract. ⚠ Its escrow chapter is superseded by `decisions.md` D3 (merchant of record) |
| `design-brief-v1.pdf` | Frontend design handover |
| `userflow-mindmap-v1.html` | Interactive product map |
| `TODO.md` | Status + open founder decisions |
