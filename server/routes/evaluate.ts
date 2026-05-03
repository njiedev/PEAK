import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { handleZodError, handleRouteError } from '../lib/errors'
import { evaluateSubmission } from '../../ai/evaluate'

const router = Router()

const bodySchema = z.object({
  waypoint: z.object({
    id: z.number(),
    title: z.string(),
    summary: z.string(),
    challenge: z.object({
      type: z.enum(['text', 'photo', 'code', 'pdf']),
      prompt: z.string(),
    }),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
  submission: z.object({
    text: z.string().optional(),
    imageBase64: z.string().optional(),
    fileBase64: z.string().optional(),
    fileName: z.string().optional(),
    fileMime: z.string().optional(),
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

  // Bridge HTTP body to Mohammed's Submission type: string | { imageBase64: string }
  const aiSubmission = submission.imageBase64
    ? { imageBase64: submission.imageBase64 }
    : submission.text!

  try {
    const feedback = await evaluateSubmission(waypoint, aiSubmission)
    res.json({ ok: true, data: feedback })
  } catch (err) {
    handleRouteError(res, err, 'evaluation failed, please try again')
  }
})

export default router
