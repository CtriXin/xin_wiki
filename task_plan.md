# Task Plan - Math Plane Game Optimization V3.1 (COMPLETE)

## Project Goal
Refactor the third mode from "Blackjack" to "Number Synthesis" (数字合成) with guaranteed solvability and limited shots.

## Objectives Reached
1.  **Redesigned Power Mode Logic**:
    -   Renamed to **"Number Synthesis" (数字合成)**.
    -   Target value is now generated alongside a "Solution Set" of numbers.
    -   Implemented **Limited Shots**: Players must reach the target within X number of bullets.
2.  **Guaranteed Solvability**:
    -   `assignNumbersToBlocks` now prioritizes injecting the `solutionSet` into the block pool.
    -   Added "Infinite Resupply": If the board is cleared but the goal isn't met, a new wave with guaranteed components spawns.
3.  **UI & Feedback**:
    -   HUD now shows **Target**, **Remaining Shots**, and **Current Sum**.
    -   Added failure messages: "TOO MUCH!" (Bust) and "OUT OF SHOTS!".
    -   Updated game-start overlay and documentation.
4.  **Gameplay Refinement**:
    -   Difficulty scales with level (Target and allowed shots increase).
    -   Failure (bust or out of shots) resets the current sum and shots, costing 1 life.

## Final Result
A much more fair and challenging mode that encourages strategic shooting and mental addition.

## Verification
-   Correct numbers are always available.
-   Shots count down correctly.
-   Reaching the exact target triggers success.
-   Going over or running out of shots causes a reset.
