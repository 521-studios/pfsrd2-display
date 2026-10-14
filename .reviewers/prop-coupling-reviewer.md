# prop-coupling-reviewer
model: sonnet
verification: evidence-query — greps `src` for the prop at the JSX call site and for `useDisplay` in the callee, and quotes both.
**Checks:** React components threading DisplayContext values (`monsterName`, `onRoll`, `onLoadMonster`, `imageBaseUrl`, `changedPaths`, `appliedTemplates`) as props instead of `useDisplay()`; hand-built providers below a stat-block root; PropTypes drift.
**Spawn when:** diff adds or changes a React component under `src/**` (`.js` that returns JSX) or `dev/harness.jsx`; skip tests, `src/constants/`, `src/shared/utils.js`, CSS and terraform.
**Contents:** Patterns to FLAG · Do NOT flag · Severity

Review React components for **unnecessary prop threading** (prop drilling).

**Core principle:** This library uses React Context (`DisplayContext`, `src/context/DisplayContext.js`) so components don't thread shared data. The context provides exactly: `onRoll`, `onLoadMonster`, `imageBaseUrl`, `monsterName`, `changedPaths`, `appliedTemplates`. Components read them with `useDisplay()` / `useIsChanged()` / `useIsAdded()` / `useChangeSources()`.

**Patterns to FLAG:**

1. **Props that should come from context:** any of the context values above passed to a child component as a prop (or destructured from props) instead of read via `useDisplay()`.
2. **A hand-built `DisplayProvider`** in a component other than a stat-block root (`CreatureStatBlock`, `HazardStatBlock`, `AfflictionStatBlock`, `ItemCard`): the provider boundary belongs at the root.
3. **A shared value passed through 2+ intermediate components** that isn't in the context: suggest adding it to the context only if three or more components read it (judgement).
4. **PropTypes drift:** a changed component whose `PropTypes` (shapes in `src/constants/`) no longer match the props it reads.

**Do NOT flag:**
- Data props specific to each component (`ability`, `attack`, `saves`, etc.), `children`, and props that genuinely vary per instance
- Consumers passing `onRoll`/`imageBaseUrl` etc. to a stat-block root (e.g. `dev/harness.jsx` → `<CreatureStatBlock>`): that is the public API, and the root puts them in the provider
- `token` and `gameId`: they are NOT in DisplayContext

**Severity:** P2 a context value threaded as a prop or a hand-built provider; P3 multi-hop threading and PropTypes drift.
