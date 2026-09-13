# Fractions Fighter

An isometric jungle adventure for ages 9–11 where maths powers strikes, spells and ancient rituals. Create a hero in Haven, explore the wilds, battle creatures and pirates, collect equipment and restore the Shattered Compass.

**Status:** development build 0.3; not yet an owner-accepted MVP. [Current state](docs/memory/STATE.md) records exact checks, deployment and remaining work.

## Play from this folder

On macOS, double-click **[Launch Fractions Fighter.command](Launch%20Fractions%20Fighter.command)**. It builds the game and opens your browser. Keep its Terminal window open while playing; Control-C stops the server. First use needs Node.js 22 LTS and an internet connection to install locked dependencies. Subsequent launches use local assets.

Start with **New game**, choose your hero and calling, then enter Haven. Use **Continue adventure** or **Load game** to resume. Click the ground to move and a monster to approach. Inventory is available in the top navigation or with **I**; **J** opens quests. Watch nearby enemies for attack warnings: move away or answer a ward to block. Armour reduces missed-ward damage; Return to Haven restores health. Simple strikes use close comparisons; power skills and rituals allow unlimited thinking time. Settings can disable falling runes.

## Develop

```sh
npm ci
npm run dev
```

Node 22 LTS recommended. `npm run check` tests and builds; `npm run test:e2e` checks the production bundle (install Chromium with `npx playwright install chromium` first).

## Continue on any model or device

Read [AGENTS.md](AGENTS.md), [STATE](docs/memory/STATE.md), [BACKLOG](docs/memory/BACKLOG.md), [preferences](docs/memory/USER_PREFERENCES.md) and the latest [session](docs/memory/sessions). [CLAUDE.md](CLAUDE.md) points to the same rules. Use [on-demand economical specialists](docs/TEAM_WORKFLOW.md), small verified increments and code-plus-memory GitHub checkpoints.

- [Game design](docs/GAME_DESIGN.md) · [Architecture](docs/ARCHITECTURE.md)
- [Learning design](docs/LEARNING_DESIGN.md) · [Art pipeline](docs/ART_DIRECTION.md)
- [Roadmap](docs/ROADMAP.md) · [Deployment](docs/DEPLOYMENT.md) · [Owner feedback](docs/feedback/2026-09-13-owner-review.md)

[GitHub repository](https://github.com/AlxSviridov/fractions_fighter). Firebase is the authorised host. Heroes save locally in each browser; export/import in Learning journal transfers progress between devices. Git backs up the project, not private browser saves. No cloud sync or child analytics service is implemented.
