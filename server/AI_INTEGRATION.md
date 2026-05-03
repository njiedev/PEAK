# AI integration — what FS1 needs from the `ai/` package

Quick reference for wiring `ai/generate.ts` and `ai/evaluate.ts` into the Express server.

## Dependencies

Already at the repo root:

```bash
npm i @anthropic-ai/sdk zod
```

## Environment

The SDK reads `ANTHROPIC_API_KEY` from `process.env`. Local dev: `.env` at repo root (already gitignored). Load it on server boot with `import 'dotenv/config'` at the top of `server/index.ts`, OR start with `node --env-file=.env`.

If the key is missing the server crashes at boot — that's intentional.

## What you import

```ts
import { generateRouteCached } from '../ai/cache'   // use this — file-cached
// import { generateRoute } from '../ai/generate'    // raw, hits Claude every time
// import { evaluateSubmission } from '../ai/evaluate'  // coming soon
```

`generateRouteCached` is the recommended import. It checks `ai/cache/<slug>.json` first; only hits Claude on cache miss. For the demo, pre-warm the cache by calling the endpoint once for each demo skill — every subsequent call is instant and free.

To force regeneration during prompt iteration: `rm -rf ai/cache/`.

## Endpoints (matching the response envelope FS2 expects)

FS2's `web/CLAUDE.md` says the backend returns `{ ok: true, data: ... }` on success or `{ ok: false, error: string }` on failure. Wrap accordingly.

### `POST /api/generate-route`

Request body:
```json
{ "skill": "build a Minecraft mod" }
```

Handler sketch:
```ts
app.post('/api/generate-route', async (req, res) => {
  const { skill } = req.body
  if (typeof skill !== 'string' || !skill.trim()) {
    return res.status(400).json({ ok: false, error: 'skill is required' })
  }
  try {
    const route = await generateRouteCached(skill.trim())
    res.json({ ok: true, data: route })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: 'Could not generate route' })
  }
})
```

`data` is a `Route` matching `shared/schema.ts`. Already validated; `x`/`y` already set.

Latency: ~8–15s on cache miss, <50ms on cache hit.

### `POST /api/evaluate-submission` (coming)

Will accept `{ waypoint: Waypoint, submission: string | { imageBase64: string } }` → return `{ feedback: string, passed: boolean }`. Not built yet.

## Out of scope on my side

CORS, request body validation (the typeof check above is on you), auth, rate limiting, structured logging.

## Sanity test

```bash
npx tsx --env-file=.env ai/testGenerate.ts "<skill>"
```

If that works and your endpoint doesn't, the bug is in the server wiring, not the AI layer.
