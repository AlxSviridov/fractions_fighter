# Session: engine-rework-plan

## Intent and decisions

Develop the owner's resource-driven combat/world interaction redesign; document a bite-size plan, commit/push it, then start implementation. Read required memory, feedback, architecture, design and workflow. Inspected branch/status/remote/history. Main started at 0d75013 with substantial inherited modified/untracked build-0.3 work. Preserve that work as an unfinished checkpoint, not a newly verified release.

## Changes

Added ENGINE_REWORK.md (inventory/HUD, authoritative simulation, moving enemies, stamina/arrows/mana, maths/pausing, defence, objects, dialogue and spell-gated quest). Added ENGINE_PLAN.md with 18 ordered increments and evidence gates. Updated durable preferences and links from legacy docs. Checked Blizzard's official manual/Arreat Summit as UI interaction references.

## Validation and limitations

Planning/document review only at this checkpoint. Inherited session reports 67 prior unit tests but its final suite was unfinished; no fresh build/e2e evidence claimed. Preserved inherited code, assets and reviews without erasing them. No Firebase deployment.

## Model use

Root orchestrator: current runtime model, architecture/planning/integration; no claim of changing model. Bounded routine P1 implementation will use explicitly selected gpt-5.6-terra per TEAM_WORKFLOW.

## Next action

Push planning/inherited checkpoint to authorised AlxSviridov/fractions_fighter. Implement P1 real character stat breakdown, full equipment comparison and safe unequip; verify then commit/push its code and memory.
