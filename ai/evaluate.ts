import Anthropic from '@anthropic-ai/sdk'
import type { Feedback, Waypoint } from '../shared/schema'
import { SUBMISSION_EVAL_SYSTEM } from './prompts/submissionEval'
import { buildRepairMessage } from './prompts/repair'
import { safeParseFeedback } from './validate'

const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 512
const TEMPERATURE = 0.5

const client = new Anthropic()

export type Submission = string | { imageBase64: string }

type TextBlock = { type: 'text'; text: string }
type ImageBlock = {
  type: 'image'
  source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png'; data: string }
}
type Content = string | Array<TextBlock | ImageBlock>
type ClaudeMessage = { role: 'user' | 'assistant'; content: Content }

function buildUserContent(waypoint: Waypoint, submission: Submission): Content {
  const intro = `The challenge was titled "${waypoint.title}". The prompt the kid saw was:\n\n${waypoint.challenge.prompt}\n\n`

  if (typeof submission === 'string') {
    return `${intro}The kid's typed submission:\n\n${submission}\n\nGive feedback as the JSON object specified.`
  }

  // Photo submission — assume JPEG. If the frontend sends PNG, swap the media_type.
  return [
    {
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: submission.imageBase64 },
    },
    {
      type: 'text',
      text: `${intro}The kid uploaded the image above as their submission. Give feedback as the JSON object specified.`,
    },
  ]
}

async function callClaude(messages: ClaudeMessage[]): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: SUBMISSION_EVAL_SYSTEM,
    messages: messages as Anthropic.MessageParam[],
  })
  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Claude returned a non-text block')
  return block.text
}

function tryParse(
  raw: string,
):
  | { ok: true; feedback: Feedback }
  | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    return { ok: false, error: `JSON.parse failed: ${(e as Error).message}` }
  }
  const validated = safeParseFeedback(parsed)
  if (!validated.success) return { ok: false, error: validated.error }
  return { ok: true, feedback: validated.data }
}

export async function evaluateSubmission(
  waypoint: Waypoint,
  submission: Submission,
): Promise<Feedback> {
  const userContent = buildUserContent(waypoint, submission)
  const userMessage: ClaudeMessage = { role: 'user', content: userContent }

  // Attempt 1
  const firstRaw = await callClaude([userMessage])
  const first = tryParse(firstRaw)
  if (first.ok) return first.feedback

  // Attempt 2 — replay history + repair message (text-only on the repair turn)
  const repairRaw = await callClaude([
    userMessage,
    { role: 'assistant', content: firstRaw },
    { role: 'user', content: buildRepairMessage(firstRaw, first.error) },
  ])
  const second = tryParse(repairRaw)
  if (second.ok) return second.feedback

  console.error('evaluateSubmission failed after repair attempt:', second.error)
  console.error('Last raw output:', repairRaw)
  throw new Error('Could not generate valid feedback after 2 attempts')
}
