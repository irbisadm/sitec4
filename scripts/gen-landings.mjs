#!/usr/bin/env node
// Recursively scans src/landings/**/*.yml and writes
// apps/web/lib/landings-data.generated.json.
// Landing id = relative path without extension (e.g. "billing/checkout").
// <folder>/index.yml maps to id <folder>. Top-level index.yml keeps id "index".
// group = name of the first subdirectory (null for top-level files).
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join, basename, extname, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const srcDir = join(root, 'src/landings')
const outFile = join(root, 'apps/web/lib/landings-data.generated.json')

if (!existsSync(srcDir)) {
  console.error(`✗ ${srcDir} does not exist`)
  process.exit(1)
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...walk(full))
    } else if (/\.ya?ml$/i.test(entry)) {
      out.push(full)
    }
  }
  return out
}

const files = walk(srcDir).sort()
if (files.length === 0) {
  console.error(`✗ no .yml files under ${srcDir}`)
  process.exit(1)
}

const landings = {}
for (const file of files) {
  const rel = relative(srcDir, file).split(sep).join('/')
  let segments = rel.replace(/\.ya?ml$/i, '').split('/')
  // <folder>/index.yml → id = <folder>. Top-level index.yml stays as "index".
  if (segments.length > 1 && segments[segments.length - 1] === 'index') {
    segments = segments.slice(0, -1)
  }
  const id = segments.join('/')
  const group = segments.length > 1 ? segments[0] : null

  const text = readFileSync(file, 'utf8')
  let parsed
  try {
    parsed = parseYaml(text)
  } catch (e) {
    console.error(`✗ ${rel}: failed to parse — ${e.message}`)
    process.exit(1)
  }
  if (!parsed || typeof parsed !== 'object') {
    console.error(`✗ ${rel}: top-level value must be an object`)
    process.exit(1)
  }
  if (typeof parsed.title !== 'string' || typeof parsed.description !== 'string') {
    console.error(`✗ ${rel}: requires string "title" and "description"`)
    process.exit(1)
  }
  if (!Array.isArray(parsed.sections)) {
    console.error(`✗ ${rel}: requires "sections" array`)
    process.exit(1)
  }
  if (landings[id]) {
    console.error(`✗ duplicate landing id "${id}" (file ${rel})`)
    process.exit(1)
  }
  landings[id] = { id, group, ...parsed }
}

mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, JSON.stringify(landings, null, 2) + '\n')
console.log(`✓ ${outFile} (${files.length} landings: ${Object.keys(landings).join(', ')})`)
