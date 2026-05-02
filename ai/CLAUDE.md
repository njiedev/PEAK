# PEAK — AI Layer (Mohammed)

You own the brain of PEAK: the prompts, the route generation logic, the submission evaluation, and the JSON validation. This is the hardest creative piece because route quality is the product. A boring route makes the demo flop. A magical, specific, age-appropriate route makes judges remember it.

## What lives in this directory

```
ai/
├── CLAUDE.md                   ← you are here
├── prompts/
│   ├── routeGeneration.ts      ← the system prompt that produces routes
│   ├── submissionEval.ts       ← the system prompt that grades user submissions
│   └── repair.ts               ← repair prompt when JSON parsing fails
├── generate.ts                 ← exported function: generateRoute(skill)
├── evaluate.ts                 ← exported function: evaluateSubmission(node, submission)
├── validate.ts                 ← Zod schema validation for the route JSON
└── mockRoute.ts                ← canned response so the team can build without hitting the API
```

The two exported functions in `generate.ts` and `evaluate.ts` are what the backend (`server/`) imports and exposes as HTTP endpoints. You don't write the Express server — that's FS1. You write the AI logic that gets wrapped.

## Your two jobs

### 1. Route generation

Input: `{ skill: string }`
Output: a fully-formed `Route` object matching the schema in `shared/schema.ts`.

The route should:
- Have 6-10 waypoints (not 3, not 20)
- Start very easy and ramp gradually
- Use language a 10-year-old can understand
- Have specific, concrete challenges, not vague ones
- Avoid generic "watch a video" challenges — every node should ask the kid to *do* something

Generate the route with a single Claude call using structured output prompting. Wrap the call in a parse-and-retry loop using `validate.ts`. If the JSON fails to parse or validate, send the error back to Claude with the repair prompt and try once more. Cap at 2 retries total.

For waypoint coordinates (`x`, `y`): don't let Claude pick raw numbers. Generate them deterministically by laying waypoints along a predefined zig-zag SVG path using arc-length interpolation. Pass the path to FS2 so the visual matches.

### 2. Submission evaluation

Input: `{ waypoint: Waypoint, submission: string | { imageBase64: string } }`
Output: `{ feedback: string, passed: boolean }`

The feedback should:
- Be encouraging but specific to what they actually submitted
- Reference the challenge prompt explicitly
- Suggest one small improvement if relevant
- Be 2-3 sentences max

For photo submissions, use Claude's vision capability. Pass the image as base64 along with the challenge prompt and ask for kind, specific feedback.

For demo purposes, `passed` should almost always be true. Kids need encouragement, not gates. Only return false if the submission is clearly empty or off-topic.

## What others are working on (just enough context)

- **Backend (FS1)** is building an Express server that wraps your two functions in HTTP endpoints. They handle CORS, request validation, error responses, and the Anthropic SDK setup. You give them clean async functions, they expose them as `POST /api/generate-route` and `POST /api/evaluate-submission`. Do not import Express or anything HTTP-related into your code.

- **Frontend (FS2)** is building the React app and the SVG mountain. They consume your route JSON to render waypoints and challenge cards. They never import your code directly — they only call the API. So your contract is the JSON shape, not the function signature.

- **Demo guy** is making the pitch and finding assets. Not relevant to your work.

## Mock data

Maintain `ai/mockRoute.ts` with a hand-crafted, beautifully written example route for the skill "learn to draw." This is what FS2 develops against until your real generation works. Keep it updated to match the latest schema. If the schema changes, the mock changes the same hour.

## Hard rules

- Never expose the Anthropic API key in code. It comes from `process.env.ANTHROPIC_API_KEY` and is set by FS1 in the server environment.
- Never call the Anthropic SDK from anywhere except `generate.ts` and `evaluate.ts`. One file per call type. No SDK calls scattered around.
- Never change the JSON shape without telling FS1 and FS2 first. The schema in `shared/schema.ts` is the contract. If you need to add a field, raise it on voice call before changing it.
- All your exported functions are pure async functions that take an input and return an output. No side effects, no logging to anything except `console.error` for failures.

## The prompt is the product

The single biggest variable in whether PEAK feels magical is the route generation prompt. Spend real time on it. Test with at least 5 different skills before locking it: "learn to draw," "learn chess," "learn Python," "learn to bake bread," "learn juggling." If any of them produces a boring or generic route, the prompt isn't done.

Specific things to put in the system prompt:
- The persona (a friendly mountain guide who builds custom routes for kids)
- The age range (8-14)
- The required JSON shape (give it the exact TypeScript type)
- The constraint that every challenge must be a concrete action, not passive consumption
- Examples of good waypoints and bad waypoints
- A reminder that the early waypoints should feel almost trivially easy so the kid gets a quick win

## When you're blocked

If the API is slow, your first move is tightening the prompt, not switching models. If validation fails repeatedly, log the malformed output and inspect it — Claude usually tells you why through the shape of its mistake. If you're behind on the eval function, ship route generation alone and let the demo waypoint completion be a hardcoded "great job!" message — the route generation matters more.

## Definition of done

`generateRoute("learn to draw")` returns a beautifully-written, schema-valid 6-10 waypoint route in under 15 seconds. `evaluateSubmission(...)` returns kind, specific, schema-valid feedback in under 8 seconds. Both functions are imported by `server/` without modification.
