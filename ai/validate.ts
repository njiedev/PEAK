import { z } from 'zod'
import type { Route, Feedback } from '../shared/schema'

// Runtime validation for Claude's route JSON output.
// Mirrors shared/schema.ts. If that file changes, change this in the same commit.

const ChallengeSchema = z.object({
  type: z.union([z.literal('text'), z.literal('photo')]),
  prompt: z.string().min(1),
})

const WaypointSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  challenge: ChallengeSchema,
  difficulty: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
})

export const RouteSchema = z.object({
  skill: z.string().min(1),
  estimatedHours: z.number().positive(),
  route: z.array(WaypointSchema).min(8).max(12),
})

// Throws on invalid input. Use when you want a hard fail.
export function parseRoute(input: unknown): Route {
  return RouteSchema.parse(input) as Route
}

// Non-throwing variant for the generate.ts retry loop:
// on failure, feed `error` back to Claude via the repair prompt.
export function safeParseRoute(
  input: unknown,
):
  | { success: true; data: Route }
  | { success: false; error: string } {
  const result = RouteSchema.safeParse(input)
  if (result.success) return { success: true, data: result.data as Route }
  return { success: false, error: result.error.toString() }
}

export const FeedbackSchema = z.object({
  feedback: z.string().min(1),
  passed: z.boolean(),
})

export function safeParseFeedback(
  input: unknown,
):
  | { success: true; data: Feedback }
  | { success: false; error: string } {
  const result = FeedbackSchema.safeParse(input)
  if (result.success) return { success: true, data: result.data as Feedback }
  return { success: false, error: result.error.toString() }
}
