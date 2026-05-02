# PEAK — Backend & Data (Full Stacker 1)

You own the server, the Anthropic SDK setup, the API endpoints, and (if we get to it) the Supabase persistence layer. Your job is to be the dumb pipe between the AI layer and the frontend. The smarts live in the AI code; you just expose it cleanly over HTTP.

## What lives in this directory

```
server/
├── CLAUDE.md                ← you are here
├── index.ts                 ← Express app entry
├── routes/
│   ├── generateRoute.ts     ← POST /api/generate-route
│   └── evaluate.ts          ← POST /api/evaluate-submission
├── lib/
│   ├── anthropic.ts         ← SDK client, env-loaded
│   └── errors.ts            ← shared error formatters
├── db/                      ← only if soft scope is reached
│   └── supabase.ts
└── .env.example             ← documents required env vars
```

## Your job, concretely

### Hour 1-2: Server scaffold

- Set up an Express server on port 3001
- Add CORS middleware allowing the frontend dev server (Vite default is `http://localhost:5173`)
- Add JSON body parsing
- Set up the Anthropic SDK client in `lib/anthropic.ts`, loaded from `process.env.ANTHROPIC_API_KEY`
- Create `.env.example` documenting every required var
- Distribute the actual `.env` file via Discord — never commit it
- Stub out the two routes so they return mock data initially. This unblocks FS2 immediately.

### Hour 2-6: Wire in the AI layer

- Import the two exported functions from `ai/`: `generateRoute` and `evaluateSubmission`
- Wrap each in an Express route handler
- Validate request bodies with Zod before calling the AI functions
- Catch and format errors so the frontend gets clean JSON error responses, not stack traces
- Every endpoint returns `{ ok: true, data: ... }` on success or `{ ok: false, error: string }` on failure

### Hour 6-12: Robustness + deploy

- Add request logging (just console, nothing fancy)
- Add a `/health` endpoint that returns 200 OK
- Deploy the server to Railway or Render so the deployed frontend can hit it
- Get the deployed URL into the frontend's `.env` so they can switch between local and prod

### Hour 12+: Soft scope

Only if everything above is solid:

- Wire up Supabase to persist generated routes by user (where "user" is just a localStorage UUID for v0)
- Add a `GET /api/route/:id` endpoint to fetch a previously generated route
- Add `POST /api/progress` to record completed waypoints

## What others are working on (just enough context)

- **AI layer (Mohammed)** is writing the actual Claude prompts and the route generation logic. They expose two pure async functions: `generateRoute(skill: string): Promise<Route>` and `evaluateSubmission(waypoint, submission): Promise<Feedback>`. You import these and expose them over HTTP. Do not write Anthropic SDK code yourself — that lives in `ai/`. Your `lib/anthropic.ts` only exists if you need a shared client instance, and Mohammed should import it rather than instantiating their own.

- **Frontend (FS2)** is building the React app. They will hit your endpoints with `fetch`. Their dev server runs on `http://localhost:5173`. They need clean error messages because they are showing them to users.

- **Demo guy** is doing pitch and assets. Not relevant.

## The contract you expose

```
POST /api/generate-route
  body: { skill: string }
  200:  { ok: true, data: Route }
  400:  { ok: false, error: "skill must be a non-empty string" }
  500:  { ok: false, error: "route generation failed, please try again" }

POST /api/evaluate-submission
  body: { waypoint: Waypoint, submission: { text?: string, imageBase64?: string } }
  200:  { ok: true, data: { feedback: string, passed: boolean } }
  400:  { ok: false, error: ... }
  500:  { ok: false, error: ... }

GET /health
  200:  { ok: true }
```

Lock this in hour 1 and don't change it without telling FS2 on voice.

## Hard rules

- **Never expose the Anthropic API key to the frontend.** All Claude calls go through your server.
- **Never trust request bodies.** Validate with Zod. Reject malformed input with a 400.
- **Never let an unhandled exception crash the server.** Wrap every route handler in a try/catch and return a clean error response.
- **CORS must be permissive in dev.** Tighten in prod only if we get there.
- **No database calls in the demo path** unless the soft scope is fully working. The demo runs on in-memory state if needed.

## What's tempting but not your job

- Don't write the Claude prompts. That's Mohammed.
- Don't render anything. You're a JSON API.
- Don't add auth. We agreed: not for v0.
- Don't add rate limiting, request signing, or any other "real backend" niceties. Skip them for the hackathon.

## When you're blocked

If the AI layer isn't ready, your routes return mock data so FS2 isn't blocked. The mock should match the schema exactly — copy `ai/mockRoute.ts` and serve that.

If your deploy fails, the demo runs locally. Have a backup plan where the frontend hits `localhost:3001` and the laptop running the demo also runs the server. This actually works fine if you test it.

## Definition of done

The two endpoints work end-to-end on a deployed URL. The frontend can hit them and get clean JSON responses. Errors return clean error messages. The server doesn't crash on bad input. `.env` setup is documented. That's it.
