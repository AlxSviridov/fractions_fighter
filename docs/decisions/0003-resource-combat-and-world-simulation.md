# 0003 — Resource combat and authoritative world interaction

Date: 2026-09-13. Status: accepted direction; staged implementation.

## Context

The owner requests Diablo II-style inventory/world interaction, moving attackers, stamina-funded melee, ammunition-funded ranged attacks, mana-funded spells and maths preparation. Only defence maths should be timed. The current renderer positions and React threat interval cannot provide one reliable pause/range/status authority as these mechanics grow.

## Decision

Use the contract in ../ENGINE_REWORK.md and implement it in ../ENGINE_PLAN.md order. Pure domain commands and fixed-step simulation own positions, attacks, resources, statuses and interactions. Rendering consumes snapshots/events. React submits commands and pause reasons. Defence response timing is the only gameplay clock permitted while its maths prompt pauses the world; hidden tabs pause that clock too.

Add systems incrementally with validated migrations. Keep the legacy list inventory for P1; introduce spatial inventory only with item conservation, placement validation and overflow storage. Do not persist half-completed UI drags or in-flight maths as completed transactions. Successful action/reward commands are idempotent; cancel and invalid targets never debit resources.

## Consequences

The old quick/focus/ritual attack loop is transitional and will be retired by channel-specific increments. Reference-quality interaction requires real inventory and simulation logic, not just visual changes. Each increment remains independently testable and saves remain recoverable. Geometry/new arithmetic require independent prompt-based review before release. No new backend is needed.
