import { promises as fs } from 'fs'
import path from 'path'
import { DEMO_SKILLS } from './demoSkills'
import { generateRouteCached } from './cache'

const CACHE_DIR = path.join(__dirname, 'cache')

function slug(skill: string): string {
  return skill
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function main() {
  await fs.mkdir(CACHE_DIR, { recursive: true })

  for (const skill of DEMO_SKILLS) {
    const file = path.join(CACHE_DIR, `${slug(skill)}.json`)
    console.log(`[demo-cache] prewarming "${skill}" -> ${path.relative(process.cwd(), file)}`)
    const route = await generateRouteCached(skill, { minLoadingMs: 0 })
    console.log(`[demo-cache] ready: ${route.route.length} waypoints, ${route.estimatedHours} estimated hours`)
  }
}

main().catch((err) => {
  console.error('[demo-cache] failed')
  console.error(err)
  process.exit(1)
})
