# Deployment and recovery

## Local
Use Node 22 LTS (`nvm use` if installed), `npm ci`, `npm run dev`. Validate with `npm run check` and `npm run test:e2e` (first install browser: `npx playwright install chromium`). Build output: `dist/`.

## GitHub
Remote: https://github.com/AlxSviridov/fractions_fighter.git . Commit code, docs, lockfile and tests; never node_modules or credentials. `git push origin main`. GitHub Actions validates pushes / PRs. A new device clones this repo, follows AGENTS.md and the current STATE. If credentials are unavailable, commit locally and record the unpushed commit explicitly; a local commit is not an off-device backup.

## Firebase Hosting
The CLI is project-local: `npx firebase`. List accounts/projects with `npx firebase login:list` and `npx firebase projects:list`. Use the dedicated project in `.firebaserc` once verified. Never borrow another project's hosting target. `firebase.json` serves `dist` with an SPA fallback and security/cache headers. Static hosting needs no Firebase client credentials.

Before release: run checks, browser QA, confirm project ID, then `npm run deploy -- --project PROJECT_ID` or `npx firebase deploy --only hosting --project PROJECT_ID` after a checked build. Hosting is explicitly authorised by the owner for a working MVP. If credentials or project selection are missing, keep the build ready and record the exact blocker; never claim deployment succeeded. No billing activation is authorised.

GitHub deployment automation can be added after a dedicated deploy identity is configured. Do not commit a Firebase token or service account. Current CI does not pretend to deploy without credentials.

## Recovery
Source: clone/pull repository, use lockfile, read STATE and last session, reproduce checks. Local player progress: export JSON from parent view and import on the other browser. Browser storage is not cloud backup. Corrupt/unknown saves should be surfaced and original data retained, not silently erased. Restore Firebase with a verified prior build or Hosting release rollback; record rollback in session memory.
