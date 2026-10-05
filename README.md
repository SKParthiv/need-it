# Need It

Campus errand app. A student posts what they need from outside campus; a
verified student helper going out anyway picks it up and hands it over at a
campus pickup point. Money is held safely and only released when both sides
confirm the handover.

**One repo, three surfaces. Read this before you push anything.**

## Layout

```
need-it/
├── apps/mobile/     # the product — Expo + React Native (TypeScript)
├── web/             # company website — Vite + React + Tailwind
├── backend/         # the API — Django + DRF + Postgres
└── docs/            # the contract — PRD, design brief, state machine
```

| Surface | Path | Stack | Owner |
|---|---|---|---|
| Mobile app | `apps/mobile/` | Expo / React Native / TS | **Frontend dev** |
| Website | `web/` | Vite / React / Tailwind | **Frontend dev** |
| API + state machine | `backend/` | Django / DRF / Postgres | **Backend founder** |
| Product contract | `docs/` | Markdown / PDF | everyone, together |

## Roles & ownership

Each person owns a lane. The API contract is the only thing that crosses lanes.

### 🎨 Frontend dev — `apps/mobile/` + `web/`
You own everything the user sees and touches.
- The app and the website are yours: design, components, screens, navigation, theming.
- You **render** state; you never **decide** it. What the app shows comes from the API.
  Need data or an action that doesn't exist? That's a conversation, not a workaround.
- **No business logic in the app.** Money math, status rules, who-can-do-what live in
  the backend. If you catch yourself writing a rule, stop.
- Build against `docs/design-brief-v1.pdf`.

### ⚙️ Backend founder — `backend/`
You own the truth.
- The API, the database, and the **order state machine** are yours.
- Every status and transition is enforced server-side; the app asks, only the backend says.

### 🤝 The contract — `docs/`
- `PRD-v1.pdf` — what we're building.
- `design-brief-v1.pdf` — what every screen must contain.
- Status vocabulary: `open → accepted → purchased → handed_over → completed`
  (plus `cancelled`). Exact words, everywhere. They don't change without everyone agreeing.

## Repo rules (keep it healthy)

1. **Never commit `node_modules/`, `dist/`, build output, or `.idea/`.** Gitignored; if one slips through, purge before pushing.
2. **Never commit secrets.** No keys, tokens, or `.env` — use `.env.example`.
3. **Keep it small.** A fresh clone is megabytes. Dependencies are installed, not stored.
4. **Pull before you push.** Sync with `main` first so merges stay clean.
5. **Change the contract together.** Status names, API shapes, payment flow — discuss before coding.

## Quick start

```bash
# Mobile
cd apps/mobile && npx expo install && npx expo start
# Web
cd web && npm install && npm run dev
# Backend
cd backend && pip install -r requirements.txt && python manage.py runserver
```

## Contributing

New to GitHub or pushing code here? **Start with the pinned "Contributing" issue**
— it has the exact safe steps (fork → branch → fetch → pull → push → PR).
