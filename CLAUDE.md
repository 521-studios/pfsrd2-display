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
- Filter templates by creature edition (server-side `applicable_to` — includes cross-type equivalence pairs)
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
# → dist/index.esm.js, dist/index.cjs, dist/style.css

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
  imageBaseUrl="/api/pfsrd2/images"  // currently unused — portraits removed pending CUP licensing
/>
```

## Search & Filtering

`CreatureSearch` / `ItemSearch` are debounced type-aheads. The **consumer owns the
data** (`search`, and the optional filter callbacks — auth/URL/types live in the
app); the library owns the UX. See `dev/harness.jsx` for the reference wiring
against pfsrd2-data-api.

```jsx
import { CreatureSearch, ItemSearch } from '@521studios/pfsrd2-display'

// search(query, filters) -> Promise<result[]>. filters is forwarded so the
// consumer builds the API params. Filter controls are opt-in: omit a callback
// and that control isn't rendered.
<CreatureSearch
  search={(q, { traits }) => fetchSuggest(q, { traits })}
  onSelect={(r) => {/* ... */}}
  suggestTraits={(prefix, selected) => fetchTraits(prefix, selected)} // → trait chips
/>

<ItemSearch
  search={(q, { traits, category, subcategory }) => fetchSuggest(q, { traits, category, subcategory })}
  onSelect={(it) => {/* ... */}}
  suggestTraits={(prefix, selected, facet) => fetchTraits(prefix, selected, facet)}  // → trait chips
  loadFacets={() => fetchFacets()}  // Promise<{category: string[]}> → category/subcategory selects
  levelFilter  // shows min/max level inputs; filters carry levelMin/levelMax
/>
```

- `suggestTraits(prefix, selected)` backs a co-occurrence chip typeahead — return
  only traits that still narrow the current selection (`/search/traits`). For
  `ItemSearch` it receives a 3rd `{ category, subcategory }` arg (the active facet)
  so suggestions co-occur within it too; `CreatureSearch` calls it with two args.
- `loadFacets()` returns the `{category: [subcategories]}` map (`/search/facets`,
  unwrap `.categories`) for the cascading dropdowns.
- `levelFilter` (bool) shows inclusive min/max level number inputs (no callback —
  the values flow through `filters` as `levelMin`/`levelMax`); works on both
  CreatureSearch and ItemSearch.
- Filter BEM classes to override: `.CreatureSearch__chip` / `__chip-input` /
  `__chip-option`, `.ItemSearch__facet-select`, `.*__level-input` (+ the same
  `__chip*` set).

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
- **Edition auto-resolution** — the template API automatically resolves edition mismatches (requesting remastered Elite for a legacy creature uses legacy Elite). Resolution follows same-type alternates first, then curated cross-type equivalents (a remastered creature given the Book of the Dead vampire *template* gets the Monster Core vampire *family* rules). The picker list uses `applicable_to=<edition>` so paired entries never double-list while unpaired other-edition content stays available.

## Ported Components

The 34 components in `src/creatures/components/` were extracted from `lets-roll/app/javascript/components/components/Monsters/PF2/`. Known issues tracked in beads:
- `Offense.js`: if/else chain could be component map (bd_521Studios-llu)

## CSS Customization

All visual elements use BEM-style class names under `.Monster__*`. Override in your app's CSS to customize appearance.

### Core layout
| Class | Purpose |
|-------|---------|
| `.Monster` | Top-level stat block container |
| `.Monster__header` | Name + level row |
| `.Monster__name` | Creature name |
| `.Monster__level` | Level + edition |
| `.Monster__trait` | Trait badge (variants: `--alignment`, `--size`, `--rarity`, `--uncommon`, `--rare`, `--unique`) |

### Interactive elements
| Class | Purpose |
|-------|---------|
| `.Monster__roll` | Clickable rollable values (dice rolls) |
| `.Monster__alternateLink` | Edition switch link |
| `.Monster__uma-toggle` | Clickable universal monster ability name (dotted underline) |
| `.Monster__uma-expansion` | Expanded UMA description box |
| `.Monster__uma-expansion-title` | UMA name inside expansion |
| `.Monster__collapsible` | Clickable collapse/expand headers |
| `.Monster__collapse-icon` | Triangle toggle indicator (rotates when `--open`) |

### Template highlighting
| Class | Purpose |
|-------|---------|
| `.Monster__changed` | Inline highlight for template-modified values |
| `.Monster__changed--block` | Block-level highlight (left border) |

### Sections and families
| Class | Purpose |
|-------|---------|
| `.Monster__section` | Collapsible section container |
| `.Monster__section-title` | Section heading |
| `.Monster__section-text` | Italic flavor text |
| `.Monster__sidebar` | Sidebar box (gold left border) |
| `.Monster__sidebar-heading` | Sidebar title |
| `.Monster__family` | Monster family container |
| `.Monster__family-title` | Family name (gold) |
| `.Monster__template` | Applied template stat block |
| `.Monster__template-title` | Template name (gold italic) |
| `.Monster__template-adjustments` | Adjustments table (gold header) |

### Stat block sections
| Class | Purpose |
|-------|---------|
| `.Monster__abilities > div` | Ability entries (hanging indent) |
| `.Monster__offense > div` | Offense entries (hanging indent) |
| `.Monster__ability_success` | Success/failure outcome indentation |
| `.Monster__hitpoints` | HP line |
| `.Monster__ac` | AC value |
| `.Monster__saves` | Saving throws |
| `.Monster__skills` | Skills list |
| `.Monster__senses` | Perception + special senses |
| `.Monster__speed` | Speed line |
| `.MonsterCard` | Portrait card (currently not rendered — portraits removed pending CUP licensing) |

### ItemCard versions
An item with variants (a rune's Striking / Greater / Major) reads like the book. With no pick yet it stacks every version (a radiogroup when the consumer passes `onVariantChange`, else a read-only list). Once a version is chosen (`variant >= 0`) the card **collapses to just that version** — rendered as the item — with a "change version" control to reopen the full choice. Arrow keys rove the highlight; Enter/Space/click lock in.

| Class | Purpose |
|-------|---------|
| `.Monster__variants` | Version list container (radiogroup or list) |
| `.Monster__variant` | One version row |
| `.Monster__variant--selectable` | Applied when the row is a selectable radio |
| `.Monster__variant--selected` | The highlighted version (accent) |
| `.Monster__variant-radio` | The ○ / ● selection dot |
| `.Monster__variant-name` / `-level` / `-price` / `-text` | Per-version fields |
| `.Monster__variant-change` | "change version" control on a locked (collapsed) card |

## Testing

Node's built-in test runner. No Jest, no Vitest, no assertion libs beyond `node:assert`.

```bash
npm test
```
