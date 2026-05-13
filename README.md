# @irbisadm/sitec4

Project architecture diagrams in [LikeC4](https://likec4.dev/) + a Next.js wrapper that adds custom landing pages and click-based navigation.

## Structure

```
sitec4/
├── src/                   # single source of truth: DSL + landing YAMLs
│   ├── likec4.config.json
│   ├── specification.c4   # element kinds, tags
│   ├── model.c4           # elements, relationships, link → landings
│   ├── views.c4           # diagrams (views)
│   └── landings/          # YAML descriptions of landings
│       ├── index.yml
│       ├── data.yml
│       ├── auth.yml
│       └── billing/
│           ├── index.yml
│           └── checkout.yml
├── apps/
│   └── web/               # Next.js 15 (App Router) wrapper
│       ├── app/           # SSR catalogs + client-side diagram
│       └── lib/
│           ├── landings.ts                          # JSON wrapper
│           ├── likec4.ts                            # model wrapper
│           ├── likec4-model.ts                      # GENERATED model (gitignored)
│           └── landings-data.generated.json         # GENERATED landings (gitignored)
├── scripts/
│   └── gen-landings.mjs   # yml → json generator
└── docs/
    └── wrapper-research.md  # research notes that led to this setup
```

## Setup

```sh
npm install   # install dependencies for every workspace
npm run gen   # generate the TS model + landings JSON in apps/web/lib/
```

## Commands

**Working with schemas (DSL):**
```sh
npm run schemas:dev        # LikeC4 dev server with live reload
npm run schemas:validate   # static DSL validation
npm run schemas:build      # static site under ./dist
npm run schemas:export:png # PNG previews of every view
```

**Working with the Next.js wrapper:**
```sh
npm run dev                # ⭐ recommended dev mode: watcher on src/ + next dev
                           #    automatically regenerates the model and landings
                           #    when src/**/*.c4 or src/landings/**/*.yml changes
npm run gen                # manually regenerate the TS model + landings JSON
npm run gen:model          # model only, from *.c4
npm run gen:landings       # landings only, from *.yml
npm run web:dev            # next dev only (no schema watcher)
npm run web:build          # production build
npm run web:typecheck      # tsc --noEmit
```

## Landings

Landings are described by YAML files under `src/landings/`. Subdirectories are supported for grouping.

**Landing id = relative path without extension:**
- `src/landings/data.yml` → id `data` → URL `/l/data` (top-level)
- `src/landings/billing/checkout.yml` → id `billing/checkout` → URL `/l/billing/checkout`
- `src/landings/billing/index.yml` → id `billing` → URL `/l/billing` (folder page)

If a folder has no `index.yml`, `/l/<folder>` renders an **auto-generated index page** listing its direct landings and subfolders.

File structure:
```yaml
title: Data
description: |                   # Markdown is supported (GFM + breaks)
  Everything related to **data storage and processing**.

  Includes:
  - business logic in `Orders`,
  - storage `PostgreSQL`,
  - relationships between them (see [Backend API](/v/api)).
sections:
  - title: Related views
    views: [app, api]            # explicit view list
  - title: Subsystems
    landings: [billing/checkout, billing]   # explicit landing list
  # - title: Storage
  #   filterByTag: data          # or filter views by tag
```

A single section can mix `views` and `landings` — both will render as cards (landings first, then views).

`description` is rendered through [`marked`](https://marked.js.org/) on the server (SSR-friendly, no JS on the client). Supports headings, lists, code, links, bold/italic, links to internal routes (`/v/...`, `/l/...`).

**Markdown in view and element descriptions (LikeC4 DSL):** use a triple-quoted string, the content is treated as markdown:

```
view api of app.api {
  title 'Backend API internals'
  description '''
    Internal structure of the **Backend API**.

    Consists of:

    - `Auth` — authentication and authorization;
    - `Orders` — order business logic.

    Used by the external [Web App](/v/index) over HTTP/JSON.
  '''
  include *
}

// Element descriptions also support markdown:
db = database 'PostgreSQL' {
  description '''
    The **primary database** of the project.

    Stores:
    - orders (see the `Orders` component);
    - audit log.
  '''
}
```

**Where element markdown descriptions show up:**

- Inside the **LikeC4 diagram** itself, on the node card (LikeC4 renders it out of the box).
- In the **“Elements in this view”** section under the diagram on `/v/[viewId]` — descriptions are collected as separate cards.

## Click navigation on landings

Set `link /l/<id>` on an element or relationship in DSL — that becomes the navigation trigger:

```
db = database 'PostgreSQL' {
  link /l/data 'Data landing'
}

api -> db 'SQL' {
  link /l/data 'Data landing'
}
```

A click on the node/edge in the diagram calls `router.push()`. The built-in LikeC4 `navigateTo` works in parallel and routes between views (`/v/<id>`).

## Guide for future changes

1. Run `npm run dev` — it rebuilds the model and landings on every edit under `src/`.
2. To add a new landing: create `src/landings/<id>.yml` and add `link /l/<id>` on the relevant DSL elements. Regeneration and reload are automatic.
3. Before committing: `npm run schemas:validate && npm run web:typecheck`.
