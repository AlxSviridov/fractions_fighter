# Art and animation pipeline

## Visual language

Jade / petrol shadows, malachite canopy, warm weathered limestone, antique brass UI, sharp turquoise relic light. Isometric storybook diorama with sculpted low-poly forms, soft cast shadows, layered foliage, carved paths, gentle drifting motes and warm firelight. Calm, precise typography; tiny tracking for metadata, large serif adventure titles. UI occupies the perimeter and lets the world breathe. Avoid copying Minecraft blocks or Diablo sprites.

## Assets now

All world meshes are original, generated in `src/game/world.ts`: six hero silhouettes, class weapons, village buildings, RPG creatures/pirates/guardian, palms, broad-leaf trees, rocks, layered ruin, guardian, relics, water, camp and foliage. Six owner-supplied portraits are copied from `precedent projects  refs/characters/avatars` to `public/assets/heroes`; they are used directly in menus and inventory. Their 3D counterparts are original procedural interpretations. The reference files do not establish a third-party redistribution license; confirm provenance before a public art release. Lucide icons are ISC licensed through the package. Cinzel headings and Crimson Pro body text are bundled from Fontsource under their SIL Open Font Licenses; no remote font requests. Lucide and font license files remain in the corresponding locked packages. Procedural animations include explorer stride, water/motes, hovering relics and guardian idle.

## Blender later

Blender is not installed at project start. It is NOT required to run or develop the current procedural slice. When the authored character / enemy milestone begins, install a stable Blender release; retain `.blend` source and export `.glb`. Before adding large binaries, configure Git LFS and document asset retrieval. Asset files must not live only on one device.

Conventions: meters, Y-up in runtime (export conversion from Blender), origin at feet, separate material slots for skin/hair/outfit, named hand/back sockets. Animation names `idle`, `walk`, `run`, `interact`, `attack`, `cast`, `hurt`, `celebrate`; root-motion policy explicit. Keep silhouette legible at the actual in-game camera distance. Export script and preview turntable accompany every final character asset.

## Quality gate

Check desktop and compact viewport, moving character readability, contrast under UI, landmark visibility, occlusion on paths, shadow cost, reduced motion, loading and error states. Record browser screenshots for release checks. Commercial reference quality is a direction requiring ongoing authored asset work, not a claim about the first procedural prototype.
