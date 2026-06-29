import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { handleZodError, handleRouteError } from '../lib/errors'
import { generateDetour } from '../../ai/generateDetour'

const router = Router()

const challengeSchema = z.object({
  type: z.enum(['text', 'photo', 'code', 'pdf']),
  prompt: z.string().min(1),
})

const waypointSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  challenge: challengeSchema,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
})

const feedbackSchema = z.object({
  feedback: z.string().min(1),
  passed: z.boolean(),
  missingSkill: z.string().min(1).optional(),
  detourHint: z.string().min(1).optional(),
})

const routeSchema = z.object({
  skill: z.string().min(1),
  estimatedHours: z.number().positive(),
  route: z.array(waypointSchema).min(1),
})

const bodySchema = z.object({
  skill: z.string().min(1),
  waypoint: waypointSchema,
  feedback: feedbackSchema,
  submissionText: z.string().optional(),
  routeContext: routeSchema.optional(),
})

router.post('/', async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    handleZodError(res, parsed.error)
    return
  }

  try {
    const detour = await generateDetour({
      skill: parsed.data.skill.trim(),
      waypoint: parsed.data.waypoint,
      feedback: parsed.data.feedback,
      submissionText: parsed.data.submissionText,
      routeContext: parsed.data.routeContext,
    })
    res.json({ ok: true, data: detour })
  } catch (err) {
    handleRouteError(res, err, 'detour generation failed, please try again')
  }
})

export default router
