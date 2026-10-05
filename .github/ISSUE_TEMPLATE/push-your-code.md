---
name: 📱 Frontend: push YOUR code safely
about: Steps for the frontend dev to land existing work without breaking the repo
title: ""
labels: guide, frontend
assignees: ""
---

# Landing your app code without breaking anything

Your work lives in `apps/mobile/`. Follow this and the merge will be clean.

## 1. Sync first (always)
```bash
git checkout main
git fetch upstream && git merge upstream/main
```

## 2. Put your code in the right place
- App source → `apps/mobile/`
- Website source → `web/`
- Nothing loose at the repo root.

## 3. Clean before commit — this is the big one
Delete these from your working copy **before** `git add`; they must never be committed:
```
node_modules/     dist/     .expo/     .idea/     .env
```
`git status` should show only real source files. If you see thousands of files, stop.

## 4. Tests
- Type-check passes: `cd apps/mobile && npx tsc --noEmit`
- Add/adjust a test for any new logic. (See `backend/apps/orders/tests.py` for the bar.)

## 5. Commit & PR
```bash
git checkout -b add-app
git add apps/mobile web
git commit -m "Add mobile app + website"
git push origin add-app
```
Open a PR. Done — review, then merge.

## ⚠️ One thing to align on first
The payment flow in the app copy ("scan store UPI QR, pay cashier directly") does NOT
match the product's escrow model (money held, released on handover). Don't build more
payment UI until we settle this — flagging here so it's not lost.
