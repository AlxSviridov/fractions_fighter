# Verdant — The Lost Map

A browser adventure where maths awakens an ancient jungle. Original 3D exploration, relic puzzles and a guardian encounter for ages 9–11 preparing maths for 11+.

**Status:** first playable vertical slice in development. See [current state](docs/memory/STATE.md) for verified features and deployment, and [roadmap](docs/ROADMAP.md) for the larger game.

## Run

```sh
npm ci
npm run dev
```

Node 22 LTS recommended. `npm run check` runs tests and production build. `npm run test:e2e` runs browser checks (install Chromium with `npx playwright install chromium` first).

## Continue on any model or device

Start with [AGENTS.md](AGENTS.md), then [STATE](docs/memory/STATE.md), [BACKLOG](docs/memory/BACKLOG.md), [preferences](docs/memory/USER_PREFERENCES.md) and the newest [session](docs/memory/sessions). Claude follows the same instructions through [CLAUDE.md](CLAUDE.md). End sessions with `npm run memory -- descriptive-slug`, update state, and commit/push code and memory together.

## Design

- [Game design and the maths / action loop](docs/GAME_DESIGN.md)
- [Architecture and save strategy](docs/ARCHITECTURE.md)
- [Learning design and parent evidence](docs/LEARNING_DESIGN.md)
- [Art direction and Blender pipeline](docs/ART_DIRECTION.md)
- [Roadmap](docs/ROADMAP.md) · [Deployment](docs/DEPLOYMENT.md) · [Decisions](docs/decisions)

GitHub: https://github.com/AlxSviridov/fractions_fighter . Intended host: Firebase Hosting. No third-party child analytics. First slice progress is stored in your browser; export/import transfers it manually. It is not yet cloud-synchronised.
