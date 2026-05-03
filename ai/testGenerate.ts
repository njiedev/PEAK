// Scratch test for generateRoute. Not part of the real flow — run by hand.
//   ANTHROPIC_API_KEY=sk-... npx tsx ai/testGenerate.ts "learn chess"
// Defaults to "build a Minecraft mod" if no skill is passed.

import { generateRouteCached as generateRoute } from './cache'

async function main() {
  const skill = process.argv[2] || 'build a Minecraft mod'
  console.log(`Generating route for: "${skill}"\n`)
  const start = Date.now()
  const route = await generateRoute(skill)
  const ms = Date.now() - start
  console.log(JSON.stringify(route, null, 2))
  console.log(`\nDone in ${(ms / 1000).toFixed(1)}s — ${route.route.length} waypoints`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
