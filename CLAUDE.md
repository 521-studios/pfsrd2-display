# pfsrd2-display

Reusable React library for rendering Pathfinder 2e creature stat blocks from pfsrd2-data JSON.

## Architecture

```
pfsrd2-display/
├── src/                  # Library source
│   ├── index.js          # Public exports
│   ├── context/          # DisplayContext (onRoll, onLoadMonster, changedPaths)
│   ├── shared/           # RollableText, Changed, Markdown, utils, patches
│   ├── creatures/        # CreatureStatBlock router + V1_2/V1_3 renderers
│   │   └── components/   # 34 presentational components (AC, Attack, Ability, etc.)
│   └── constants/        # PropTypes shapes
├── dev/                  # Development harness (Vite + React)
│   ├── harness.jsx       # Search, template application, stat block rendering
│   ├── vite.config.mjs   # Dev server config with JSX-in-JS plugin
│   └── index.html        # Entry point
├── styles/               # CSS (extracted into dist/style.css on build)
├── assets/fonts/         # Pathfinder2eActions.ttf
└── docker-compose.yml    # Harness + pfsrd2-data-api
```

## Dev Harness

The `dev/` directory is a **reference implementation** for consumers of this library. It demonstrates the correct way to:

- Search for creatures via the pfsrd2-data-api
- Render stat blocks with `CreatureStatBlock`
- Wire up `onRoll`, `onLoadMonster`, and `imageBaseUrl` callbacks
- Apply templates via `POST /templates/apply` with multipart response parsing
- Stack multiple templates and merge patch documents
- Pass `patches` prop for change highlighting
- Filter templates by creature edition
- Paginate API responses
- Switch between schema versions

**Treat harness code as production-quality example code.** No shortcuts, no magic numbers, no fragile hacks. Consumers will copy patterns from here.

## Running

```bash
# Development (docker-compose: harness + API)
cp .env.example .env   # set REAL_HOME for snap docker
docker compose up
# → http://localhost:5173

# Build library
npm run build
# → dist/index.esm.js, dist/index.cjs.js, dist/style.css

# Tests
npm test
```

## Consumer API

```jsx
import { CreatureStatBlock } from '@521studios/pfsrd2-display'
import '@521studios/pfsrd2-display/style.css'

<CreatureStatBlock
  data={creatureJSON}
  patches={patchGroups}           // optional — from template API, enables highlighting
  onRoll={({ type, label, formula, structuredFormula }) => { /* ... */ }}
  onLoadMonster={(gameId) => { /* ... */ }}
  imageBaseUrl="/api/pfsrd2/images"
/>
```

## Template Change Highlighting

When `patches` is provided (merged `applied_patches` from the template API), modified values are visually highlighted:

- **Inline values** (AC, saves, HP, skills, damage types): orange background + underline
- **Block sections** (abilities added by template): orange left border
- **Traits** (creature types added by template): orange badge background
- **Per-item precision**: only newly added items highlight, not existing ones

## Key Design Decisions

- **JSX in .js files** — components use `.js` extension (ported from lets-roll). Vite dev config has a custom `jsxInJs` plugin to handle this. Rollup uses `@rollup/plugin-babel`.
- **No dice dependency** — `RollableText` + `onRoll` callback replaces lets-roll's `dice.js` + `rollService`. The library never rolls dice — it fires callbacks.
- **Context over props** — `DisplayContext` provides `monsterName`, `onRoll`, `imageBaseUrl`, `changedPaths`. Components use `useDisplay()` / `useIsChanged()`. No prop threading for shared data.
- **Schema version as float** — API returns `schema_version` as a number (1.4), not a string. `CreatureStatBlock` coerces to string internally.
- **Patch paths use JSON Pointer** (RFC 6901) — `/stat_block/defense/ac/value`. Append operations use `/-` suffix.
- **Edition auto-resolution** — the template API automatically resolves edition mismatches (requesting remastered Elite for a legacy creature uses legacy Elite).

## Ported Components

The 34 components in `src/creatures/components/` were extracted from `lets-roll/app/javascript/components/components/Monsters/PF2/`. Known issues tracked in beads:
- `Ability.js` / `Affliction.js`: mutable render variables (bd_521Studios-2ne)
- `Attack.js`: mutates props via `setLabel` (bd_521Studios-efi)
- `Offense.js`: if/else chain could be component map (bd_521Studios-llu)

## Testing

Node's built-in test runner. No Jest, no Vitest, no assertion libs beyond `node:assert`.

```bash
npm test
```
