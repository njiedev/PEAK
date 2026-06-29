import './loadEnv'
import express from 'express'
import cors from 'cors'
import generateRouteHandler from './routes/generateRoute'
import evaluateHandler from './routes/evaluate'
import generateDetourHandler from './routes/generateDetour'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: true }))
app.use(express.json({ limit: '10mb' }))

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/generate-route', generateRouteHandler)
app.use('/api/evaluate-submission', evaluateHandler)
app.use('/api/generate-detour', generateDetourHandler)

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'not found' })
})

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
})
