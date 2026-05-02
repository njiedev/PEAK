# PEAK — Product Requirements Document

**Hackathon:** BeaverHacks 2026
**Build window:** 24 hours
**Team:** 4 people (3 coders + 1 demo/pitch)

---

## What PEAK is

PEAK is an AI-generated interactive learning app for kids. A user types in a skill they want to learn ("learn to draw," "learn chess basics," "learn to code in Python"), and PEAK generates a personalized **climbing route up a mountain**. Each waypoint on the route is a small lesson or challenge. The user starts zoomed in on their current position so the next step feels achievable, and as they progress the camera pulls back to reveal the full scale of the climb behind and ahead of them.

The mountain metaphor is the soul of the product. It reframes learning from "scrolling a list of lessons" into "ascending a real-feeling path." The zoom-out reveal is the emotional and visual moment that makes the product memorable.

## Why this exists

Kids using AI tutors today get walls of text and disconnected lessons. There is no sense of progress, no spatial memory of where they've been, and no satisfaction in advancing. Existing skill-tree apps are flat, gamified shells that feel like chores (Duolingo's tree, Khan Academy's units).

PEAK uses spatial metaphor and AI-generated personalization to make learning feel like an expedition the kid is actually on, not a checklist they're working through.

## Demo target

Sixty seconds. The judge watches:

1. A kid types a skill they want to learn
2. The mountain appears, zoomed in tight on the first waypoint
3. The kid clicks the waypoint → a small challenge appears
4. They submit something (a typed answer or an uploaded photo)
5. Claude responds with personalized feedback
6. The waypoint fills in with their trail color
7. The camera zooms out, revealing the full route winding up to the peak
8. They click the next waypoint and it begins again

Everything else is cut. If we have time we add polish on top of this loop.

## Hard scope (must exist for demo)

- Skill input screen with a single text field and a Begin button
- Claude integration that generates a route as structured JSON
- Mountain illustration with an SVG route path drawn on top
- Waypoints rendered as clickable points along the path
- Challenge card UI that opens when a waypoint is tapped
- One challenge type that accepts user input (text or photo)
- Claude-powered feedback on the user's submission
- A trail color that fills in completed sections of the route
- A zoom-out animation triggered after a waypoint completes
- Local state persistence (in-memory or localStorage is fine)

## Soft scope (only if ahead of schedule)

- Multiple challenge types per node (quiz, photo, text reflection)
- Climber character sprite that visually moves along the route
- Mist/fog effect over uncompleted sections
- Streak tracking
- Cosmetic unlocks (hat, backpack)
- Adaptive difficulty (re-generation if the user struggles)
- Supabase persistence and auth
- Multiple route generations side by side

## Out of scope

- Auth, accounts, parent dashboards
- Payment, subscriptions
- Mobile native apps
- Phaser, Three.js, or any game engine
- Backend logic beyond a thin API layer
- Spaced repetition or memory algorithms
- Multiplayer or social features

## The JSON contract

Locked in hour 1. Everything depends on this. Backend generates it from Claude, frontend consumes it for both the route rendering and the challenge cards.

```json
{
  "skill": "learn to draw",
  "estimatedHours": 12,
  "route": [
    {
      "id": 1,
      "title": "Draw basic shapes",
      "summary": "Get comfortable drawing circles, squares, and triangles freehand.",
      "challenge": {
        "type": "photo",
        "prompt": "Draw 5 circles on paper and upload a photo. Try to make them as round as you can!"
      },
      "difficulty": 1,
      "x": 0.18,
      "y": 0.82
    },
    {
      "id": 2,
      "title": "Light and shadow",
      "summary": "Understand how light direction creates shadow on simple objects.",
      "challenge": {
        "type": "text",
        "prompt": "If a light is shining from the left, where will the shadow of a ball fall? Explain in your own words."
      },
      "difficulty": 2,
      "x": 0.32,
      "y": 0.68
    }
  ]
}
```

The `x` and `y` fields are normalized 0-1 coordinates representing position on the mountain SVG. Backend generates these intelligently so the path winds upward (lower y = higher on mountain).

`challenge.type` is one of `"text"` or `"photo"` for v0.

## Tech stack

- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend:** Node + Express (or Next.js API routes if simpler)
- **AI:** Anthropic API (Claude Sonnet 4)
- **DB:** Supabase (only if soft scope is reached, otherwise in-memory)
- **Hosting:** Vercel for frontend, Railway or Render for backend
- **Repo:** GitHub, branch per person, merge to main only when working

## The integration seams

Three people building three pieces against one contract:

- **AI layer (Mohammed)** produces the route JSON. Exposes a single endpoint: `POST /api/generate-route { skill: string }` returns the JSON above. Also exposes `POST /api/evaluate-submission { nodeId, submission }` which returns Claude's feedback.
- **Mountain renderer (Full stacker 2)** consumes the route JSON. Renders mountain + path + waypoints. Emits a `onWaypointClick(nodeId)` event upward to the React shell. Exposes a `setCompleted(nodeId)` method that updates the visual trail.
- **App shell (Full stacker 2 also OR split with FS1)** owns routing, the skill input screen, the challenge card overlay, the submission flow, and orchestration between the API and the mountain.
- **Backend infra (Full stacker 1)** owns the Express server, the Anthropic API calls, prompt engineering for route generation, response validation, and CORS setup.

Note: with three coders, the React work splits across the two full stackers. FS1 owns backend + AI prompting. FS2 owns app shell + mountain SVG. Mohammed floats — owns the AI prompt design and any piece of integration that's blocked.

## Risks and how to handle them

**Risk: Claude returns malformed JSON.** Wrap every generation call in a parse-and-retry. If parse fails, send the error back to Claude and ask for a corrected response. Cap at 2 retries.

**Risk: Route coordinates produce ugly paths.** Backend should not let Claude pick raw coordinates. Instead, generate the number of waypoints + difficulty curve, and let the frontend lay them out along a predefined SVG path using arc length interpolation.

**Risk: Photo evaluation hallucinations.** Claude's vision will say nice things about almost any submission. That's fine for demo — kids need encouragement, not harsh grading. But the prompt must explicitly reference the challenge so feedback feels specific.

**Risk: Integration hell at hour 18.** Mitigated by the JSON contract and the mock-data approach (everyone builds against fake data until APIs are ready).

**Risk: Phaser/canvas temptation.** Banned. Pure SVG + CSS transforms only.

## Hour-by-hour shape

- **0-1:** Setup, schema lock, environment shared, branches created.
- **1-2:** Each person scaffolds their piece against mock data.
- **2-9:** Heads-down individual work.
- **9-10:** First integration attempt. Expect breakage. Identify mismatches.
- **10-16:** Fix integration, polish core loop.
- **12 (mid-checkpoint):** Cuts conversation. Anything not on the demo path gets dropped.
- **16-20:** Polish, animation tuning, demo dry runs.
- **20-22:** Demo guy finalizes pitch deck and script. Coders fix last bugs.
- **22-24:** Code freeze. Rehearse demo twice. Sleep if possible.

## Definition of done for the demo

The demo runs end-to-end, locally or on a deployed URL, without any visible errors, in under 60 seconds, with the zoom-out reveal happening cleanly. Everything else is gravy.
