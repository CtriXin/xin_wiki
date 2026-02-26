# Findings - Math Plane Game Optimization V3.0

## Multi-file confusion
- `docs/public/game/index.html`: Legacy V1 (Classic).
- `docs/public/game-full.html`: Legacy V1 (Full screen wrapper).
- `docs/public/game-v2.html`: Latest V3 (Multi-mode).

## Speed Mode Obstacle
- The user is looking for a "Launch" button.
- I will rename "Impact Mode" to something like "Turbo Ram" and add a visual cone to the front of the speed plane.

## 21-Point Block Drought
- Logic bug: If the player clears all blocks but doesn't hit the target sum, they get stuck.
- Fix: `if (blocks.length === 0 && !targetReached) spawnBlocks();`
- This makes the game "Infinite" within a level until the math goal is solved.
