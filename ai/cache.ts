import { promises as fs } from 'fs'
import path from 'path'
import type { Route } from '../shared/schema'
import { DEMO_SKILLS, normalizeSkill } from './demoSkills'
import { generateRoute } from './generate'
import { safeParseRoute } from './validate'

// File-backed cache for demo use. First call generates and writes;
// subsequent calls with the same skill (or a similar enough one)
// read from disk — no API call.

const CACHE_DIR = path.join(__dirname, 'cache')
const MIN_LOADING_MS = 10_000
const SIMILARITY_THRESHOLD = 0.5

const DEMO_SKILL_LOOKUP = new Map(DEMO_SKILLS.map((skill) => [normalizeSkill(skill), skill]))

const STOPWORDS = new Set([
  'i', 'a', 'an', 'the', 'to', 'of', 'for', 'on', 'in', 'at', 'by',
  'my', 'me', 'we', 'our', 'your', 'you', 'own',
  'want', 'wants', 'wanted', 'like', 'need', 'needs',
  'learn', 'learning', 'learns', 'learned',
  'how', 'what', 'why', 'when', 'where',
  'is', 'am', 'are', 'be', 'being', 'been',
  'do', 'does', 'did', 'doing',
  'can', 'could', 'would', 'should',
  'and', 'or', 'but', 'so',
  'this', 'that', 'these', 'those',
  'with', 'without', 'about',
  'get', 'getting', 'make', 'making', 'start', 'starting',
  'please',
])

function slug(skill: string): string {
  return skill
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function tokens(skill: string): Set<string> {
  return new Set(
    skill
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t)),
  )
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const t of a) if (b.has(t)) intersection++
  const union = a.size + b.size - intersection
  return intersection / union
}

async function readCacheExact(skill: string): Promise<Route | null> {
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

async function readCacheSimilar(skill: string): Promise<Route | null> {
  let entries: string[]
  try {
    entries = await fs.readdir(CACHE_DIR)
  } catch {
    return null
  }

  const inputTokens = tokens(skill)
  if (inputTokens.size === 0) return null

  let best: { route: Route; score: number; cachedSkill: string } | null = null

  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue
    try {
      const raw = await fs.readFile(path.join(CACHE_DIR, entry), 'utf8')
      const parsed = JSON.parse(raw)
      const validated = safeParseRoute(parsed)
      if (!validated.success) continue
      const cachedSkill = validated.data.skill
      const score = similarity(inputTokens, tokens(cachedSkill))
      if (score >= SIMILARITY_THRESHOLD && (!best || score > best.score)) {
        best = { route: validated.data, score, cachedSkill }
      }
    } catch {
      // ignore broken files
    }
  }

  if (best) {
    console.log('[ai-cache] fuzzy match', {
      requested: skill,
      matched: best.cachedSkill,
      score: best.score.toFixed(2),
    })
    return best.route
  }
  return null
}

async function writeCache(skill: string, route: Route): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true })
  const file = path.join(CACHE_DIR, `${slug(skill)}.json`)
  await fs.writeFile(file, JSON.stringify(route, null, 2), 'utf8')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type CacheOptions = {
  minLoadingMs?: number
}

export async function generateRouteCached(skill: string, options: CacheOptions = {}): Promise<Route> {
  const cacheSkill = DEMO_SKILL_LOOKUP.get(normalizeSkill(skill)) ?? skill
  console.log('[ai-cache] route requested', { skill, cacheSkill })
  const startedAt = Date.now()
  const minLoadingMs = options.minLoadingMs ?? MIN_LOADING_MS

  const cached = (await readCacheExact(cacheSkill)) ?? (await readCacheSimilar(cacheSkill))
  if (cached) {
    console.log('[ai-cache] cache hit', { skill, waypoints: cached.route.length })
    const elapsed = Date.now() - startedAt
    const remaining = minLoadingMs - elapsed
    if (remaining > 0) {
      console.log('[ai-cache] holding loading state', { remainingMs: remaining })
      await sleep(remaining)
    }
    return cached
  }

  console.log('[ai-cache] cache miss, calling Claude', { skill })
  const fresh = await generateRoute(cacheSkill)
  console.log('[ai-cache] Claude route generated', { skill, waypoints: fresh.route.length })
  await writeCache(cacheSkill, fresh)
  console.log('[ai-cache] route cached', { skill })
  return fresh
}
