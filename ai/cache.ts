import { promises as fs } from 'fs'
import path from 'path'
import type { Route } from '../shared/schema'
import { generateRoute } from './generate'
import { safeParseRoute } from './validate'

// File-backed cache for demo use. First call generates and writes;
// subsequent calls with the same skill read from disk — no API call.
//
// Use this from the server in place of generateRoute when you want
// reproducible demo behavior. Pre-warm the cache before the demo by
// running: `npx tsx ai/testGenerate.ts "<skill>"` (after switching
// the test script to call generateRouteCached) — or just hit the
// endpoint once.

const CACHE_DIR = path.join(__dirname, 'cache')

function slug(skill: string): string {
  return skill
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function readCache(skill: string): Promise<Route | null> {
  const file = path.join(CACHE_DIR, `${slug(skill)}.json`)
  try {
    const raw = await fs.readFile(file, 'utf8')
    const parsed = JSON.parse(raw)
    const validated = safeParseRoute(parsed)
    return validated.success ? validated.data : null
  } catch {
    return null
  }
}

async function writeCache(skill: string, route: Route): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true })
  const file = path.join(CACHE_DIR, `${slug(skill)}.json`)
  await fs.writeFile(file, JSON.stringify(route, null, 2), 'utf8')
}

export async function generateRouteCached(skill: string): Promise<Route> {
  console.log('[ai-cache] route requested', { skill })
  const cached = await readCache(skill)
  if (cached) {
    console.log('[ai-cache] cache hit', { skill, waypoints: cached.route.length })
    return cached
  }

  console.log('[ai-cache] cache miss, calling Claude', { skill })
  const fresh = await generateRoute(skill)
  console.log('[ai-cache] Claude route generated', { skill, waypoints: fresh.route.length })
  await writeCache(skill, fresh)
  console.log('[ai-cache] route cached', { skill })
  return fresh
}
