# Critical playtest review — 13 September 2026

Independent bounded review of the rebuilt development app at localhost:5173, using the actual in-app browser at 1280 × 720. Perspective: **simulated 10-year-old gamer**, not a real child study. Engagement conclusions below are hypotheses for owner/child validation. Reviewed New Game → Mooncat/Warden creation → Haven → wilds → first power kill → inspect/equip loot → wrong and correct quick strike. Full expedition, persistence, other devices and performance benchmarking belong to the integrator's separate QA gate.

## Priority findings

1. **High: combat impact is hidden behind the answer screen.** A correct first power answer (75% of 180 = 135) defeated the Bramble Prowler, awarded 35 XP/12 gold and Tidefang, but the player saw an opaque success modal over a blurred world until pressing Return to the fight. `App.answerAction` invokes attack/loot effects immediately; `finishCast` closes the modal later. The renderer's elapsed clock continues while paused. The exciting consequence can finish out of sight. Show the attack after the question clears, or expose the battlefield while retaining optional worked explanation. Hypothesis: answering will still feel like completing a worksheet if the strike itself is not visible.

2. **Medium: mathematical keyboard focus is misplaced and then lost.** Opening the focus question put focus on Close dialog rather than Your answer. On success, the removed answer/Unleash control left focus on the document instead of Return to the fight. `Modal` explicitly focuses its first button unless a `data-autofocus` target exists, overriding the input's React `autoFocus`; neither quick encounter nor success state sets a new focus target. Set the answer target on entry and focus the success action when contents change; preserve reliable keyboard access to quick answers. Verified through the browser accessibility focus state.

3. **Medium: loot does not explain its actual upgrade.** Tidefang says “+4 attack”, while equipping it changes total attack from 12 to 14 because it replaces the starter blade. This is mathematically consistent but easy to misread as a four-point improvement. The pack offers no equipped-item comparison. Display both the item's contribution and “Attack 12 → 14 (+2)” before equipping; support negative changes as well. Verified actual total before and after equip.

## Additional observations

- New/load structure, six attractive portraits, Haven entry, five visible monsters, explicit action damage and immediate persistent-looking equipment rewards are substantial improvements over the rejected prototype. No claim of owner acceptance follows from this review.
- The Mooncat portrait is expressive, but the small rear-facing world model reads mainly as a hat and humanoid body at this view. The portrait-to-world identity gap needs owner review and close-up silhouette tuning.
- Quick comparison 4/10 versus 50% worked: a wrong greater-than answer reduced health 100 → 96, stopped the timer, and allowed a correct less-than retry, dealing 14 damage. Wrong-answer text says the ward “caught the blow” without stating the four health lost; make the cost explicit beside feedback.
- “Show a hint — Stops the falling rune” also appears on an already untimed power question. Hide this timer explanation for focus/ritual questions.
- The quick answer explanation disappears automatically after 850 ms. That is too brief for deliberate reading; retain it in an optional recap or permit inspection without slowing every ordinary strike.
- No crash or obvious input-lag problem was observed in this short run. This is not FPS, memory, battery, or low-spec laptop evidence. The renderer continues running behind menus; measure its background cost before claiming a performance target.

## Follow-up status

Findings sent directly to the integrating agent. No application code changed by this reviewer. This document records the observed build before any integrating-agent fixes; fixes require separate recheck evidence.

## Build 0.3 integration follow-up

Root inspected the actual built game in the in-app browser at 1280×720 on 2026-09-13. Attack animation now occurs after the question clears; an optional Review last rune retains the worked method. Inventory shows total-stat comparisons and original item illustrations. Proactive enemy wards show incoming attack, armour absorption and health at risk. Successful blocking and movement out of telegraph range were observed. The river route, pirate outpost and guardian sanctuary are visually distinguishable; bridge bounds were extended after code review found the first scenic pass inaccessible. Return/toast overlap with the inventory and short-laptop quest/trail overlap were corrected.

Critical remaining play hypothesis: scenery makes the space more legible, but a single compact arena, identical ward patterns and finite question/drop pools still limit the desire to explore. The far-bank beacon has no reward yet. Next product work should add a real optional discovery and purposeful village spending before simply making the map larger. Mooncat still has a substantial portrait/world silhouette gap. These are simulated review findings, not real child evidence.

## P1 inventory / CI follow-up, 13 September 2026

Root actual-browser review: character stat breakdown, safe unequip (12 → 10 attack), retained blade and keyboard re-equip work. Close control now remains available during sheet scrolling. Critical finding: the sheet is tall at 1280×720 and remains three slots/list-backed, not completed spatial inventory. P2/P3 must improve packing and arrangement. All five browser regressions passed locally, including full expedition and transfer. CI logs exposed a real loot/Haven-return overlap, fixed by spacing; no forced clicks. Simulated adult review only, not a child trial.
