import Anthropic from '@anthropic-ai/sdk'
import type { Route, Waypoint } from '../shared/schema'
import { ROUTE_GENERATION_SYSTEM } from './prompts/routeGeneration'
import { buildRepairMessage } from './prompts/repair'
import { safeParseRoute } from './validate'

const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 4096
const TEMPERATURE = 0.8

const client = new Anthropic()

type ClaudeMessage = { role: 'user' | 'assistant'; content: string }

async function callClaude(messages: ClaudeMessage[]): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: ROUTE_GENERATION_SYSTEM,
    messages,
  })
  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Claude returned a non-text block')
  return block.text
}

function tryParse(
  raw: string,
):
  | { ok: true; route: Route }
  | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    return { ok: false, error: `JSON.parse failed: ${(e as Error).message}` }
  }
  const validated = safeParseRoute(parsed)
  if (!validated.success) return { ok: false, error: validated.error }
  return { ok: true, route: validated.data }
}

// Lay waypoints along a zig-zag climbing path. Claude's x/y are ignored.
function assignCoordinates(waypoints: Waypoint[]): Waypoint[] {
  const n = waypoints.length
  return waypoints.map((wp, i) => {
    const t = n === 1 ? 0 : i / (n - 1)
    const y = 0.92 - t * 0.84
    const x = 0.5 + 0.32 * Math.sin(i * 1.1)
    return { ...wp, x, y }
  })
}

export async function generateRoute(skill: string): Promise<Route> {
  const userMessage: ClaudeMessage = {
    role: 'user',
    content: `Build a route for the skill: "${skill}"`,
  }

  // Attempt 1
  const firstRaw = await callClaude([userMessage])
  const first = tryParse(firstRaw)
  if (first.ok) {
    return { ...first.route, route: assignCoordinates(first.route.route) }
  }

  // Attempt 2: replay history + repair message
  const repairRaw = await callClaude([
    userMessage,
    { role: 'assistant', content: firstRaw },
    { role: 'user', content: buildRepairMessage(firstRaw, first.error) },
  ])
  const second = tryParse(repairRaw)
  if (second.ok) {
    return { ...second.route, route: assignCoordinates(second.route.route) }
  }

  console.error('generateRoute failed after repair attempt:', second.error)
  console.error('Last raw output:', repairRaw)
  throw new Error('Could not generate a valid route after 2 attempts')
}
