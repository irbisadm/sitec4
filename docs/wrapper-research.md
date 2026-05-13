# Research: LikeC4 wrapper with custom landings

This document records the research process and the decisions taken or deferred. Update as new evidence appears.

**Outcome: Scenario A was chosen (Next.js + `ReactLikeC4`) and implemented in `apps/web/`.** See the "Implemented path" section at the bottom.

## Goals

1. **Multiple custom landings** — separate overview pages collecting views (filtered by topic/tag/domain), linked to each other via navigation.
2. **Click on a node or relationship** in the diagram → jump to another view **or to a custom landing**.
3. Ideally SSR (Nuxt 4 / Next.js), buildable to static files via Node.

## What LikeC4 gives us (and what it doesn't)

### Provides
- DSL for the model + views (`.c4` / `.likec4`).
- CLI: `dev`, `build`, `validate`, `export png`.
- Code generation:
  - `likec4 codegen model` → typed TS model (`LikeC4Model<$Aux>`), including layouted data (node coordinates, edge waypoints, label bounding boxes).
  - `likec4 codegen react` → ready-made React module with `ReactLikeC4`/`LikeC4View`.
  - `likec4 codegen webcomponent` → IIFE bundle exposing a `<c4-view>` custom element.
- Multi-project mode: a `likec4.config.json` per folder — every project gets its own landing.

### Does not provide
- **Multiple landings within one project** — only one. Controlled by `landingPage.include/exclude` filters.
- **`navigateTo` pointing at a landing** — DSL only accepts a `view` id. `navigateTo` between projects also doesn't work.
- **HTML/branding customization of the landing** (logo, custom "About" sections). Only theme/palette.

## What we tried

### Experiment 1 — `<c4-view>` web component

Generated `generated/c4.js` (2.2 MB / ~600 KB gzipped) via `likec4 gen webcomponent -w c4`. Wired it into `sandbox/index.html`.

**Findings:**
- `<c4-view>` is a **static preview thumbnail** with a fixed `aspect-ratio` taken from the view's `bounds` and `max-width: 320px` by default (configurable via the `--likec4-view-max-width` CSS variable).
- Only three attributes are supported: `view-id`, `browser`, `dynamic-variant`. No `pannable`/`zoomable`/`onNodeClick` — those live in the React API.
- `browser` is a boolean attribute by HTML convention (presence = true). Passing the string `"false"` breaks zod validation and blocks the render.
- With `browser` enabled, clicking the preview opens a `<c4-browser>` modal with pan/zoom and internal navigation. But **click events on nodes are not emitted to the outside** — neither from the preview nor from the modal.

**Conclusion:** the web component is a dead end for goal (2). At best it's an embeddable static thumbnail for landings, no interactivity.

### Experiment 2 — `generated/likec4-model.ts`

Generated via `likec4 gen model`. Fully layouted structure:

```ts
views: {
  [viewId]: {
    title, description, tags, links,
    bounds: { x, y, width, height },
    nodes: [{ id, title, description, kind, shape, color, style,
              modelRef, tags, navigateTo?, parent, children, level,
              inEdges, outEdges, x, y, width, height, labelBBox }],
    edges: [{ source, target, label, color, line, head,
              points: [[x,y], ...], labelBBox }],
  },
}
```

Suitable as a complete data source for any custom renderer (Vue Flow, hand-rolled SVG, anything). No need to redo layout.

## Options that actually satisfy both goals

| Approach | Click events leak out | Custom navigation | Landings | MVP | Stack |
|---|---|---|---|---|---|
| **A. Next.js + `ReactLikeC4`** | ✅ `onNodeClick`, `onEdgeClick`, `onNavigateTo` | ✅ via callback → `router.push` | own Next routes | **3–4 days** | React |
| **B. Nuxt host + React island via MFE** | ✅ | ✅ via bridge (props/events) | Nuxt routes | 6–8 days | Vue + React |
| **C. Nuxt host + custom React in iframe** | ✅ | ✅ via `postMessage` | Nuxt routes | 4–5 days | Vue + React |
| **D. Vue Flow + `generated/likec4-model.ts`** | ✅ natively in Vue Flow | ✅ natively | Nuxt routes | ~2 weeks MVP, ~6 weeks full parity | pure Vue |

### Options ruled out (recorded for posterity)

- `<c4-view>` web component (node click events don't escape).
- Default `likec4 build` site (internal navigation, no way to intercept events).
- LikeC4 multi-project + `link <url>` (no reactive navigation on clicks — plain links only).
- Mermaid C4 (the C4 DSL is experimental, no "single source of truth model", every diagram has to be authored separately).
- PlantUML + Kroki + statics (images only, no events).
- Structurizr Lite (not Vue/Next, foreign UI).

## Comparison against key requirements

| Requirement | A (Next.js) | B (Nuxt+MFE) | C (Nuxt+iframe) | D (Vue Flow) |
|---|---|---|---|---|
| Multiple landings as routes | ✅ | ✅ | ✅ | ✅ |
| Node/edge click → navigation | ✅ out of the box | ✅ via bridge | ✅ via postMessage | ✅ natively |
| SSR for catalogs | ✅ | ✅ (Nuxt) | ✅ (Nuxt) | ✅ (Nuxt) |
| SSR for the diagram | ⚠️ docs say "doesn't hydrate", CSR | same | iframe = CSR | Vue Flow needs DOM → CSR |
| Client bundle | one (React + LikeC4) | Vue + React (split) | isolated by iframe | Vue + Vue Flow |
| Infra complexity | low | **high** | medium | low |
| Full feature parity (walkthrough, sequence, details) | free | free | free | **3–4 weeks of work** |
| UI customization freedom | full | high | iframe-bounded | full |
| Catching up with LikeC4 releases | automatic | automatic | automatic | manual |

## Current recommendation

**If React is acceptable in the stack → Scenario A (Next.js).** The most direct path: 3–4 days to MVP with clicks/navigation, all of LikeC4's rendering features for free. Landings are plain Next routes; click-based navigation is a handler that calls `router.push()` in `onNavigateTo`/`onNodeClick`.

**If the stack must stay Vue/Nuxt:**
- quick prototype / interim → **Scenario C (iframe + custom React app inside)**.
- long-term integration → **Scenario B (MFE)**, paying for it with two build pipelines.

**Scenario D (Vue Flow) is only worth it if React is forbidden** (org policy, ecosystem). The price is a few months of work and the ongoing cost of catching up with LikeC4 features.

## Decision log

- **Web-component path closed** (2026-05-12): empirically confirmed — node click events do not escape. The `sandbox/` and `generated/c4.js` artifacts were removed during cleanup.
- **LikeC4 multi-project considered and deferred**: gives multiple landings, but no `navigateTo` between them — only external links.
- **Forking LikeC4 considered and deferred**: the scope of edits across DSL/AST/web-app/codegen plus the ongoing rebase cost is too high. Revisit if the chosen wrapper hits hard limits.
- **Scenario A chosen and implemented** (2026-05-12): Next.js 15 + `ReactLikeC4` under `apps/web/`. See below.

## Implemented path (Scenario A)

**Stack:** Next.js 15 (App Router) + React 18 + `@likec4/diagram@1.47.0` (Mantine 8) + npm workspaces.

**`apps/web/` structure:** see `CLAUDE.md` → "Next.js wrapper architecture".

**How the original goals are met:**

| Goal | How |
|---|---|
| Multiple custom landings | `/` and `/l/<id>` routes (SSR) + config in `apps/web/lib/landings.ts` |
| Click on node → navigate | `onNodeClick` reads `node.links`, calls `router.push()`. Fallback: `node.navigateTo` |
| Click on relationship → navigate | `onEdgeClick` resolves `links` via `likec4model.relationship(edge.relations[0])` (works around the LikeC4 API asymmetry) |
| Source of truth for navigation | DSL: `link /l/<id>` on element/relationship — not wrapper code |

**Gotchas hit while implementing (recorded):**

1. **`useEffectEvent` requires React 19.2+**: `@likec4/diagram@1.50+` pulls in `@mantine/hooks@9` which depends on that hook. Next.js 15 ships a slightly older React compiler internally. Pinning to `1.47.0` (Mantine 8, no `useEffectEvent`) works around it.
2. **`node:module` in the generated model**: the default import path is `likec4/model`, which pulls in `node:module` (incompatible with webpack). The `--use-core-package` flag retargets to `@likec4/core/*` — webpack-friendly.
3. **`ssr: false` is not allowed in a Server Component**: Next.js 15 refuses it. The fix is a client wrapper `DiagramClient.tsx` with `'use client'` + `dynamic(..., { ssr: false })`.
4. **Shadow-root hydration breaks on first render**: `Cannot set properties of null (setting 'adoptedStyleSheets')`. A mounted pattern in `Diagram.tsx` (`useState(false)` + `useEffect`) works around it.
5. **`DiagramEdge` in `onEdgeClick` does NOT include `links`/`navigateTo`**, unlike `DiagramNode`. Resolve them via `likec4model.relationship(edge.relations[0])`.
6. **Edge label hit-box** in the DOM lives on `.likec4-edge-label--pointerEvents_all` (not on its parent `.likec4-edge-label-container` — that one has `pointer-events: none`). Useful when scripting edge-click tests.
7. **Markdown inside cards** — wrapping a `<Link>` around block-level HTML (the `<p>`/`<ul>` from `marked`) produces invalid markup, and the browser auto-repair caused hydration mismatches. Switched cards to the "stretched-link" pattern: card is `<article>`, only the `<h3>` is `<a class="card-link">`, CSS stretches it across the whole card.

**Smoke tests are green** across:
- 6+ SSR pages (`/`, `/l/...`, `/v/...`).
- Click-based navigation through both `link` and `navigateTo` on nodes and edges.
- Deep landing folders (5 levels: `shop/inventory/warehouse/zones/north`).
- Auto-generated folder pages for directories without an `index.yml`.

## Still open

- Theming (light/dark) — currently follows system preference.
- PNG previews on catalog cards — `likec4 export png` exists but isn't wired into the UI.
- CI: automatic `schemas:validate` + `web:typecheck` + smoke run on every PR.
- Sequence-variant dynamic views — not exercised yet, should work out of the box in `ReactLikeC4`.
