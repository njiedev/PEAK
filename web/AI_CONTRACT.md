# AI contract — what FS2 needs to know

You don't import any AI code. You only consume JSON over HTTP from the backend. This doc tells you the shape and where to grab the mock.

## The shape

Comes from `shared/schema.ts`:

```ts
type Route = {
  skill: string
  estimatedHours: number
  route: Waypoint[]   // 8–12 waypoints, ramps difficulty 1 → 5
}
type Waypoint = {
  id: number
  title: string
  summary: string
  challenge: { type: 'text' | 'photo'; prompt: string }
  difficulty: 1 | 2 | 3 | 4 | 5
  x: number  // 0–1 normalized horizontal
  y: number  // 0–1 normalized vertical (lower = higher on mountain)
}
```

`x`/`y` are already laid out along a zig-zag climb (base → peak). You can render them as-is, or override with your own arc-length math along your SVG path — your call. The CLAUDE.md mentions overriding for prettier results; that still works fine.

## Mock data — start here

`ai/mockRoute.ts` exports a hand-crafted Minecraft-mod route with 8 waypoints. Copy it into `web/src/mockRoute.ts` and import it everywhere until the API is real:

```bash
cp ai/mockRoute.ts web/src/mockRoute.ts
```

Then fix the relative import at the top of the copied file (`../shared/schema` → `../../shared/schema`).

If the schema changes, the mock changes the same hour and you re-copy.

## Endpoints

Hosted by FS1 at `import.meta.env.VITE_API_URL` (e.g. `http://localhost:3001`).

### `POST /api/generate-route`

Request:
```json
{ "skill": "build a Minecraft mod" }
```

Response on success:
```json
{ "ok": true, "data": <Route> }
```

Response on failure:
```json
{ "ok": false, "error": "..." }
```

Expect ~8–15s latency on first call for a new skill, near-instant on repeat (server-side cache). Show a friendly loading state — "Building your route..." or similar.

### `POST /api/evaluate-submission` (coming)

Will return `{ ok: true, data: { feedback: string, passed: boolean } }`.

## Demo flag

Per your CLAUDE.md, `api.ts` should support a flag that returns the mock instead of fetching, in case the backend goes down. The mock is identical in shape to the real response's `data`, so swap is trivial:

```ts
import { mockRoute } from './mockRoute'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function generateRoute(skill: string): Promise<Route> {
  if (USE_MOCK) return mockRoute
  const res = await fetch(`${API_URL}/api/generate-route`, { ... })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error)
  return json.data
}
```

## Things you should NOT do

- Don't call the Anthropic API directly (your CLAUDE.md already says this).
- Don't change `shared/schema.ts` without telling Mohammed and FS1.
- Don't assume `route.length` is fixed — it's 8–12, lay your path math out for any count in that range.
