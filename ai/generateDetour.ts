import Anthropic from '@anthropic-ai/sdk'
import type { Detour, Feedback, Route, Waypoint } from '../shared/schema'
import { DETOUR_GENERATION_SYSTEM } from './prompts/detourGeneration'
import { buildRepairMessage } from './prompts/repair'
import { safeParseDetour } from './validate'

const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 1024
const TEMPERATURE = 0.7

const client = new Anthropic()

type ClaudeMessage = { role: 'user' | 'assistant'; content: string }

export type DetourRequest = {
  skill: string
  waypoint: Waypoint
  feedback: Feedback
  submissionText?: string
  routeContext?: Route
}

async function callClaude(messages: ClaudeMessage[]): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: DETOUR_GENERATION_SYSTEM,
    messages,
  })
  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Claude returned a non-text block')
  return block.text
}

function tryParse(
  raw: string,
):
  | { ok: true; detour: Detour }
  | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    return { ok: false, error: `JSON.parse failed: ${(e as Error).message}` }
  }
  const validated = safeParseDetour(parsed)
  if (!validated.success) return { ok: false, error: validated.error }
  return { ok: true, detour: validated.data }
}

function buildUserMessage(request: DetourRequest): string {
  const routeTitles = request.routeContext?.route
    .map((waypoint, index) => `${index + 1}. ${waypoint.title}`)
    .join('\n')

  return JSON.stringify({
    skill: request.skill,
    parentWaypoint: request.waypoint,
    evaluatorFeedback: request.feedback,
    submissionText: request.submissionText?.slice(0, 4000),
    routeTitles,
  }, null, 2)
}

function normalizeDetour(detour: Detour, parentWaypointId: number): Detour {
  return {
    ...detour,
    id: detour.id || `detour-${parentWaypointId}`,
    parentWaypointId,
    difficulty: Math.min(3, Math.max(1, detour.difficulty)) as 1 | 2 | 3,
  }
}

export async function generateDetour(request: DetourRequest): Promise<Detour> {
  const userMessage: ClaudeMessage = {
    role: 'user',
    content: buildUserMessage(request),
  }

  const firstRaw = await callClaude([userMessage])
  const first = tryParse(firstRaw)
  if (first.ok) return normalizeDetour(first.detour, request.waypoint.id)

  const repairRaw = await callClaude([
    userMessage,
    { role: 'assistant', content: firstRaw },
    { role: 'user', content: buildRepairMessage(firstRaw, first.error) },
  ])
  const second = tryParse(repairRaw)
  if (second.ok) return normalizeDetour(second.detour, request.waypoint.id)

  console.error('generateDetour failed after repair attempt:', second.error)
  console.error('Last raw output:', repairRaw)
  throw new Error('Could not generate a valid detour after 2 attempts')
}
