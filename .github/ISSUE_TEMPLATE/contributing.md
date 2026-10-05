---
name: 🤝 How to contribute (start here)
about: The safe, exact steps for pushing code — for GitHub newcomers
title: ""
labels: guide
assignees: ""
---

# How to contribute to Need It (safe steps)

Welcome! Follow these exactly and you can't break anything. When in doubt, stop and ask.

## One-time setup
1. **Fork** this repo (top-right → Fork) to your account.
2. Clone **your fork**:
   ```bash
   git clone https://github.com/<you>/need-it.git
   cd need-it
   ```
3. Add the main repo as `upstream` so you can pull updates:
   ```bash
   git remote add upstream https://github.com/SKParthiv/need-it.git
   ```

## Every time you start work
```bash
git checkout main
git fetch upstream
git merge upstream/main      # or: git pull upstream main
git checkout -b my-change    # ALWAYS work on a branch, never main
```

## Before you push
- [ ] `node_modules/`, `dist/`, `.idea/`, `.env` are NOT in your changes (`git status` — they should never appear).
- [ ] No secrets anywhere.
- [ ] Your code runs (app: `npx tsc --noEmit`; backend: `python manage.py test`).
- [ ] If you changed the app: did you add/extend **tests** for it?

## Push & PR
```bash
git add -A && git commit -m "short clear message"
git push origin my-change
```
Then open a **Pull Request** from your fork's branch into this repo's `main`.
Someone reviews before merge. Never push straight to `main`.

## The golden rule
**If `git` shows you something you didn't expect — stop, don't force anything, ask.**
Conflicts are normal; we'll resolve them together.
