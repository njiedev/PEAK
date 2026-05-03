import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { handleZodError, handleRouteError } from '../lib/errors'
import { generateRouteCached } from '../../ai/cache'

const router = Router()

const bodySchema = z.object({
  skill: z.string().min(1, 'skill must be a non-empty string'),
})

router.post('/', async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    handleZodError(res, parsed.error)
    return
  }

  try {
    const route = await generateRouteCached(parsed.data.skill.trim())
    res.json({ ok: true, data: route })
  } catch (err) {
    handleRouteError(res, err, 'route generation failed, please try again')
  }
})

export default router
