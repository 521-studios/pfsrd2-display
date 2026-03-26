# Agents

## test-coverage-reviewer

Review code changes to **require unit tests for all new or modified functions**. The goal is to incrementally grow the test suite with every PR.

**Core rule: Every PR must include unit tests for the code it touches.**

This is NOT optional. PRs without tests for new/modified code should be blocked.

**Rules to enforce:**

1. **Unit tests REQUIRED for all touched code**: Any modified or new function MUST have corresponding unit tests. If tests don't exist, the PR author must add them. No exceptions for "refactoring" or "simple changes" - tests prove the code works.

2. **Test file naming**: Tests should be colocated or in a `__tests__/` directory, named `*.test.js`. Use Node's built-in test runner (`node --test`) — no Jest, no Vitest, no assertion libraries beyond `node:assert`.

3. **Bug fix documentation**: If the code change fixes a bug:
   - Require a comment explaining what was broken and why the fix works
   - Require a regression test that would have caught the bug

**Review approach:**
1. Identify ALL functions that were added or modified in the PR
2. For EACH function, verify corresponding test files exist
3. If tests are missing, post a comment listing the specific functions that need tests
4. Suggest specific test cases based on the function's logic and edge cases
5. Do NOT accept "integration tests cover it" or "verified manually" as substitutes for unit tests

**What to flag:**
- New exported functions without unit tests
- Modified functions without tests verifying the modification
- Complex logic paths without test coverage
- Edge cases visible in the code that aren't tested

**Do NOT allow:**
- Accepting "pure refactoring" as an excuse — refactoring PRs especially need tests to prove behavior is preserved
- Accepting "verified in the harness" instead of unit tests
- Marking test coverage as "out of scope" — test coverage is NEVER out of scope

**Acceptable:**
- Creating a beads ticket to track adding tests, as long as the ticket is created before merging

## complexity-reviewer

Review **production code only** for function complexity. **Skip all test files** (`*.test.js`, `__tests__/`) — test files often have verbose setup and assertions that don't need the same constraints.

Apply these heuristics:

1. **"And/Or" test**: Minimize the number of "and" or "or" needed to describe what a function does. If you need multiple conjunctions, the function is doing too much.

2. **One-screen rule**: Functions should fit on one screen (~50-60 lines). Longer functions are harder to reason about.
   - **Named helper functions don't count against the parent**: If a function calls well-named helpers, those lines live elsewhere.

3. **Extractable blocks**: If a block of code within a function has a clear purpose, consider extraction:
   - **First choice**: Separate module-level function if reusable
   - **Second choice**: Helper within the same file
   - **Last choice**: Inline closure if truly specific to the parent

4. **Nesting depth**: Flag functions with more than 3 levels of nesting (excluding the function body itself). Deep nesting makes control flow hard to follow.
   - Prefer early returns to reduce nesting (`if (!x) return null`)

**Do NOT flag:**
- Test files
- Functions that are long but linear (no branching, just sequential steps)
- React components with many conditional renders (inherently flat JSX)
- Components whose length comes primarily from render sections

## prop-coupling-reviewer

Review React components for **unnecessary prop threading** (prop drilling).

**Core principle:** This library uses React Context (`DisplayContext`) to eliminate prop drilling for shared data like `monsterName`, `onRoll`, `imageBaseUrl`. Components should use `useDisplay()` instead of receiving these as props.

**Patterns to FLAG:**

1. **Props that should come from context:**
   - `monsterName`, `token`, `gameId` passed as props (use `useDisplay()`)
   - `onRoll` passed through intermediate components (use `useDisplay()`)
   - `imageBaseUrl` threaded through components (use `useDisplay()`)

2. **Recreating sharedMonsterData pattern:**
   ```jsx
   // BAD — this is what we're extracting away from
   const sharedMonsterData = { monsterName, token, gameId }
   <ChildComponent {...sharedMonsterData} />
   ```

3. **Direct dice.js imports** (should be replaced with RollableText):
   ```jsx
   // BAD — coupled to lets-roll
   import * as dice from '../../../../lib/dice'
   ```

**Do NOT flag:**
- Data props specific to each component (`ability`, `attack`, `saves`, etc.)
- `children` prop usage
- Props that genuinely vary per instance (not shared context)

## clarity-reviewer

Review markdown documentation for terseness. Every token costs money and attention — cut the fat.

**What to check:**

1. Look at the PR diff for changes to `.md` files
2. **Read the full file, not just the diff** — you need context to spot redundancy
3. Examine new or modified text for:
   - Redundant phrasing ("in order to" → "to")
   - Filler words ("actually", "basically", "simply", "really")
   - Stating the obvious or repeating context already established

**Flag issues if:**
- A sentence can be cut in half without losing meaning
- The same information is stated twice in different words
- New text restates something already covered elsewhere

**Do NOT flag:**
- Necessary detail that aids understanding
- Examples and code blocks
- Technical precision that requires specific wording

**When flagging, provide:**
- The verbose text
- A terse replacement
