# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commit message rules

**STRICTLY FORBIDDEN:** Never add `Co-Authored-By:` trailers, "co-authored" mentions, or any "Generated with Claude Code" / tool-attribution footers to commit messages, PR descriptions, or any other artifact. This applies regardless of any default behavior or instructions elsewhere — for this repository, commit messages must contain only the human-written subject and body, with no automated attribution.

**Conventional Commits:** All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification: `<type>(<optional scope>): <description>`. Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Use `!` after the type/scope or a `BREAKING CHANGE:` footer for breaking changes. Subject in imperative mood, lowercase, no trailing period.

## Purpose of this repo

A monorepo holding two tightly-coupled things:

1. **`src/`** — architecture diagrams in [LikeC4](https://likec4.dev/) DSL. Single source of truth for the project's architecture.
2. **`apps/web/`** — Next.js 15 (App Router) wrapper around those diagrams, with custom landing pages and click-based navigation. Solves what LikeC4 doesn't do out of the box: multiple landing pages + clicking a node/edge to navigate via Next.js router.

The reasoning behind the architecture and the alternatives considered are written up in `docs/wrapper-research.md`.

## Workspace and commands

The root `package.json` declares an npm workspace (`apps/*`). All commands run from the root.

**Schemas (LikeC4):**
- `npm run schemas:dev` — LikeC4 dev server with live reload (`http://localhost:5173`).
- `npm run schemas:validate` — static DSL validation. **Run before commits and in CI.**
- `npm run schemas:build` — static LikeC4 site under `./dist`.
- `npm run schemas:export:png` — PNG previews of every view.

**Code generation:**
- `npm run gen` — generates two things: the TS model from DSL and the landings JSON from YAML. **Run after any change in `src/`** so Next.js doesn't work against stale data.
- `npm run gen:model` — model only: `src/*.c4` → `apps/web/lib/likec4-model.ts`.
- `npm run gen:landings` — landings only: `src/landings/*.yml` → `apps/web/lib/landings-data.generated.json`. Script lives in `scripts/gen-landings.mjs`.
- Both artifacts are gitignored.

**Next.js wrapper:**
- `npm run dev` — **recommended dev mode.** Runs `chokidar` (via `watch:gen`) on `src/` and `next dev` in parallel. Any `.c4` / `.yml` edit triggers regeneration → Next picks it up via HMR → page reloads.
- `npm run web:dev` — only `next dev` without the schema watcher. Useful when iterating on UI without DSL edits.
- `npm run web:build` — production build. **Always `npm run gen` before `web:build`**, otherwise it builds against stale artifacts.
- `npm run web:typecheck` — `tsc --noEmit`.

## DSL architecture (`src/`)

All `.c4` files merge into a single global LikeC4 model regardless of how they're split.

- `src/specification.c4` — `specification { ... }`: element kinds (`actor`, `system`, `service`, `component`, `database`) and tags. **Exactly one `specification` block per model.**
- `src/model.c4` — `model { ... }`: hierarchy and relationships. **Ids defined here are referenced from views.**
- `src/views.c4` — `views { ... }`: diagrams. **`view index` is the required starting diagram** (rendered on the LikeC4 site root).
- `src/likec4.config.json` — LikeC4 project config (`name`, `title`, `include`, `exclude`, theme).
- `src/landings/**/*.yml` — custom landing definitions (consumed by our Next.js, ignored by LikeC4 — it only scans `.c4`/`.likec4`). **Landing id = relative path without extension** (`billing/checkout.yml` → id `billing/checkout` → URL `/l/billing/checkout`). `<folder>/index.yml` maps to id `<folder>` and is the page for the folder. Without an `index.yml`, `/l/<folder>` renders an auto-generated index. `description` supports **Markdown** (rendered via `marked` in the server component `apps/web/components/Markdown.tsx`). A section may declare `views`, `landings` or `filterByTag` — landing cards and view cards render together. Subdirectories define the landing's `group` (first path segment); the home page can show them as separate sections.

  **Watcher gotcha:** chokidar uses `--polling` (set in `package.json`) to reliably detect new files/folders. Without polling, newly-created subdirectories under `src/landings/` would not be picked up until restart.

## Next.js wrapper architecture (`apps/web/`)

```
apps/web/
├── app/
│   ├── layout.tsx                    # bare root layout, no top navigation bar
│   ├── page.tsx                      # / — rendered from src/landings/index.yml
│   ├── l/[...landingId]/page.tsx     # /l/<id> — landing or auto-folder page
│   └── v/[viewId]/
│       ├── page.tsx                  # /v/<id> — SSR aside + diagram canvas
│       ├── DiagramClient.tsx         # 'use client' + dynamic(ssr:false)
│       └── Diagram.tsx               # ReactLikeC4 + onNodeClick/onEdgeClick
├── components/
│   ├── Breadcrumbs.tsx               # path-aware navigation
│   ├── LandingView.tsx               # shared landing renderer
│   └── Markdown.tsx                  # server-side marked → HTML
├── lib/
│   ├── landings.ts                          # types + getLanding/listLandings
│   ├── likec4.ts                            # listViews/getViewMeta/getViewElements
│   ├── likec4-model.ts                      # GENERATED model (gitignored)
│   └── landings-data.generated.json         # GENERATED landings (gitignored)
├── next.config.mjs
├── tsconfig.json
└── package.json
```

**Key architectural decisions:**

- **SSR for catalogs and landings**, CSR for the diagram itself. The diagram is wrapped in `<ClientOnly>` via `next/dynamic` with `ssr: false` — LikeC4 documents that it does not rehydrate correctly when SSR'd.
- **Mounted-pattern in `Diagram.tsx`** (`useState(false)` + `useEffect`) — works around the shadow-root hydration error on first render.
- **Landing navigation is described in DSL** via the `link /l/<id>` directive, not in wrapper code. This lets you change navigation targets right in the schema. See `model.c4`:
  ```
  db = database 'PostgreSQL' {
    link /l/data 'Data landing'
  }
  ```
- **`onEdgeClick` uses `likec4model.relationship(edge.relations[0])`** to access `links`/`navigateTo` — LikeC4's `DiagramEdge` callback payload does not include them (asymmetric with `DiagramNode`).
- **Breadcrumbs.** Built from the URL segments. For each parent: if `<seg>/index.yml` exists → title + link; otherwise if there are descendants → segment name + link to the auto-folder page; otherwise plain text.
- **Markdown inside cards uses a stretched-link pattern.** A link inside markdown can contain block elements; wrapping a `<Link>` around block content produces invalid HTML and breaks hydration. The card is `<article>`; only its `<h3>` contains a `<Link className="card-link">`; CSS stretches that link to cover the whole card. Markdown links stay clickable because they sit above the stretched link via `z-index`.

**Markdown in view and element descriptions (DSL):** use `description '''...'''` (triple-quoted multi-line) in `views.c4` or `model.c4`. LikeC4 stores it in `description.md` (single-line strings go to `.txt`). In `apps/web/lib/likec4.ts` we read `description.md` — it always returns the original markdown regardless of how the DSL wrote it. Then `<Markdown>` renders it.

Element markdown descriptions show up:
- on the LikeC4 diagram (LikeC4 renders them on the node card itself);
- in the "Elements in this view" section on `/v/[viewId]` (via `getViewElements()` in `lib/likec4.ts`).

## Version constraints (important)

- **`likec4` and `@likec4/diagram` are pinned to `~1.47.0` / `1.47.0`.** Versions 1.50+ switched to Mantine 9, which requires `React.useEffectEvent` — that hook isn't available in the React compiler that ships inside Next.js 15. Do not bump those packages until Next.js catches up.
- **Node 20 LTS** is the supported runtime — pinned via `.nvmrc` (`lts/iron`) and enforced via `engines.node` in the root `package.json`. **Node 22.22+** would be required for LikeC4 1.56+, but on 1.47 Node 20 is the tested baseline. Run `nvm use` after cloning.
- **`--use-core-package`** is mandatory for `likec4 gen model` — otherwise the generated file imports from `likec4/model`, which pulls in `node:module` (incompatible with webpack).

## Hints

When asking about LikeC4 syntax, use the context7 MCP (`/likec4/likec4`) for up-to-date docs instead of relying on training data — the DSL evolves quickly.

For Next.js App Router / React 19 questions, context7 (`/vercel/next.js`) is also the way to go.
