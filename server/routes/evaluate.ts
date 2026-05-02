import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { handleZodError } from '../lib/errors'

const router = Router()

const bodySchema = z.object({
  waypoint: z.object({
    id: z.number(),
    title: z.string(),
    summary: z.string(),
    challenge: z.object({
      type: z.enum(['text', 'photo']),
      prompt: z.string(),
    }),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
  submission: z.object({
    text: z.string().optional(),
    imageBase64: z.string().optional(),
  }),
})

router.post('/', async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    handleZodError(res, parsed.error)
    return
  }

  const { waypoint, submission } = parsed.data
  const hasContent = (submission.text?.trim().length ?? 0) > 0 || !!submission.imageBase64

  if (!hasContent) {
    res.status(400).json({ ok: false, error: 'submission must include text or an image' })
    return
  }

  // evaluateSubmission is not yet implemented in ai/evaluate.ts
  // Return encouraging mock feedback until Mohammed ships it
  res.json({
    ok: true,
    data: {
      feedback: `Great work on "${waypoint.title}"! You gave it a real shot and that's what counts. Keep climbing — the next waypoint is waiting for you!`,
      passed: true,
    },
  })
})

export default router
