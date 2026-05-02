import { Response } from 'express'
import { ZodError } from 'zod'

export function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ ok: false, error: message })
}

export function handleZodError(res: Response, err: ZodError) {
  const issues = err.issues ?? err.errors
  const message = issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
  sendError(res, 400, message)
}

export function handleRouteError(res: Response, err: unknown, fallbackMessage: string) {
  console.error(`[server] ${fallbackMessage}:`, err)
  sendError(res, 500, fallbackMessage)
}
