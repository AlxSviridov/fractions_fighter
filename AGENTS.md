# Project operating instructions

## Read first, every session
1. Read this file, `docs/memory/STATE.md`, and `docs/memory/BACKLOG.md`.
2. Read `docs/memory/USER_PREFERENCES.md` and the latest session note.
3. Inspect `git status`, branch, remote and recent commits before changing anything.
4. Read the relevant design / architecture docs and decision records. Do not assume chat history exists.

## Product contract
Build **Verdant — The Lost Map**, repository `AlxSviridov/fractions_fighter`: a browser adventure supporting 11+ maths practice for ages 9–11, laptop first. Original jungle/ancient-ruin setting; melee, bows, relic magic, no firearms. Meaningful maths powers exciting actions. Free movement and safe thinking time. Customisable protagonist. Configurable difficulty, measurable topic progress, parent view. See `docs/GAME_DESIGN.md` for the loop and honest release scope.

## Work and memory
- Git-tracked files are durable memory; model-specific chat memory is supplementary.
- Start with `npm ci` on a new device. Use Node 22 LTS. `npm run dev` runs the app.
- Keep maths generators and game transitions pure, typed and separate from rendering.
- Store stable user preferences in `docs/memory/USER_PREFERENCES.md`; architectural decisions in numbered `docs/decisions/*.md`; concrete work in `docs/memory/BACKLOG.md`.
- At each meaningful checkpoint update `docs/memory/STATE.md` (what actually works, failures, exact next action, test evidence, deployment state). Avoid aspirational claims.
- At end of EVERY session run `npm run memory -- short-slug`, fill in the generated log with changes, validation, decisions, limitations, next steps. Update STATE and BACKLOG. Commit code AND memory together. Push to the authorised GitHub repo when available; report unpushed work explicitly. Never force-push or overwrite another contributor's work.
- Keep this file canonical. `CLAUDE.md` refers here; do not fork instructions. On case-insensitive macOS, do not create lowercase duplicates of AGENTS.md / CLAUDE.md.
- Never commit credentials, real child records, exports, or service-account files. Auth sessions do not transfer in Git.
- Do not mark a feature shipped without verifying it; distinguish prototype, implemented MVP, and roadmap.
- Scope is ambitious; deliver tested increments with explicit limitations rather than a superficial feature checklist.

## Quality gates
`npm run check` (maths/state/save tests + strict TypeScript + production build), and `npm run test:e2e` for a release. Inspect the rendered game in a real browser. Test keyboard controls, an entire expedition, mistakes/hints, save/reload, character changes, and parent reporting. Avoid unnecessary repeated tests. Use seeded generation, exact rational comparisons and independent test oracles. Include accessibility and reduced-motion support.

## Delivery
Firebase Hosting is the authorised host. Never deploy to an unrelated existing Firebase project. See `docs/DEPLOYMENT.md`. GitHub Actions performs validation; deployment uses a verified explicit project. No paid services or billing activation without approval. Prefer local procedural assets until authored models are needed; source and license every imported asset.
