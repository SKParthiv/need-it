# docs/ — the contract

Everything both founders build against. If the code and a doc disagree, the doc
wins until the doc is changed — by agreement, not by accident.

| File | What it is | Who it serves |
|---|---|---|
| `PRD-v1.pdf` | The user requirements — what we're building | everyone |
| `state-machine.md` | **The contract.** Order + payment states, transitions, guards, money rules | both founders |
| `design-brief-v1.pdf` | Every screen and what it must contain (no backend detail) | frontend / UI |
| `userflow-mindmap-v1.html` | Interactive map of the whole system — screens, API, data model, auth (open in a browser, click to expand) | everyone |
| `backend-plan.md` | Orchestrator-ready phased build plan + free-tier storage analysis | backend |
| `backend-setup-and-deployment.md` | How to run, deploy, and scale the backend | backend |
| `TODO.md` | Current status and next steps | everyone |

## Reading order for a newcomer

1. `PRD-v1.pdf` — the what
2. `userflow-mindmap-v1.html` — the whole shape, visually
3. `state-machine.md` — the rules that make money safe
4. Then your lane: `design-brief-v1.pdf` (frontend) or `backend-plan.md` (backend)
