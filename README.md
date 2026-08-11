# @521studios/pfsrd2-display

Reusable React library for rendering Pathfinder 2e stat blocks and item cards from pfsrd2-data JSON.

Not published to npm (`private: true`). Consumed as a **git dependency** by
sibling apps in the 521 Studios workspace.

## Installing

```bash
npm install github:521-studios/pfsrd2-display
# or, for local development against a working copy:
npm install git+file:///path/to/pfsrd2-display
```

`dist/` is gitignored — it's built on install via the `prepare` script (npm
runs `prepare` for git dependencies after installing devDependencies), so no
build artifacts are committed to the repo.

### Peer dependencies

The consuming app must provide these itself:

```json
{
  "react": ">=18",
  "react-dom": ">=18"
}
```

### CSS

Stat block and card styling ships as a separate stylesheet — import it once
in your app entry point:

```js
import '@521studios/pfsrd2-display/dist/style.css'
```

## Usage

```jsx
import { CreatureStatBlock, ItemCard } from '@521studios/pfsrd2-display'

<CreatureStatBlock
  data={creatureJSON}
  patches={patchGroups}           // optional — from template API, enables highlighting
  onRoll={({ type, label, formula, structuredFormula }) => { /* ... */ }}
  onLoadMonster={(gameId) => { /* ... */ }}
  imageBaseUrl="/api/pfsrd2/images"  // currently unused — portraits removed pending CUP licensing
/>

<ItemCard data={itemJSON} />
<ItemCard data={itemJSON} masked maskLabel="unidentified potion" />
```

See `CLAUDE.md` for architecture, CSS class reference, and design decisions.
