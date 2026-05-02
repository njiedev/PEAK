# PEAK — Root CLAUDE.md

This file is the source of truth for Claude (and Claude Code) when working anywhere in the PEAK repo. Read this before doing anything.

## What you're building

PEAK is an AI-generated learning app for kids. User types a skill, gets a personalized climbing route up a mountain. Each waypoint is a small lesson. The wow moment is the zoom-out reveal that shows the full route after they complete their first waypoint.

Read `PRD.md` in the root for full product context.

## Hard rules

- **No game engines.** No Phaser, no Three.js, no Pixi. Mountain is rendered with SVG + CSS transforms only.
- **No new dependencies without checking with the team.** Stick to React, Tailwind, shadcn, the Anthropic SDK, and what's already in package.json.
- **Never mutate the JSON contract** in `shared/schema.ts` without team agreement. Other people's code depends on its exact shape.
- **No auth in v0.** Skip Supabase auth and just use local state. We can add it post-hackathon.
- **No long-running tasks.** Every API call should resolve in under 30 seconds. If Claude is slow, that's on the prompt — make it tighter.

## The JSON contract (memorize this)

```ts
type Route = {
  skill: string
  estimatedHours: number
  route: Waypoint[]
}

type Waypoint = {
  id: number
  title: string
  summary: string
  challenge: {
    type: 'text' | 'photo'
    prompt: string
  }
  difficulty: 1 | 2 | 3 | 4 | 5
  x: number  // 0-1, normalized
  y: number  // 0-1, normalized (lower = higher on mountain)
}
```

This lives in `shared/schema.ts` and is imported everywhere.

## Repo structure

```
peak/
├── PRD.md                  ← read this first
├── CLAUDE.md               ← you are here
├── shared/
│   └── schema.ts           ← THE contract, do not change without team
├── server/                 ← FS1 owns this
│   ├── CLAUDE.md
│   └── ...
├── web/                    ← FS2 owns this
│   ├── CLAUDE.md
│   └── ...
└── ai/                     ← Mohammed owns this
    ├── CLAUDE.md
    └── prompts/
```

Each subdirectory has its own CLAUDE.md with the context for that area. When working in a subdirectory, read the local CLAUDE.md before doing anything.

## Working style

- Branch per person, named `mohammed/`, `fs1/`, `fs2/` prefixes.
- Merge to main only when something demonstrably works.
- Voice call stays open the whole hackathon.
- Mock data first, real integration later. Everyone has a `mockRoute.ts` they can develop against.
- Commit messages are short and honest. "wip", "broken but saving", "route renders" — fine. We're not writing this for a code review.

## What we cut first if behind

In order:
1. Photo challenges (text only)
2. Multiple challenge variations
3. Trail color fill animation
4. Supabase persistence
5. Anything that isn't on the 60-second demo path

What we **never** cut:
- Skill input → route generation
- Mountain renders with waypoints
- Click waypoint → challenge → submit → feedback
- The zoom-out reveal

## When in doubt

The 60-second demo is the product. If a feature doesn't show up in those 60 seconds, it's not the priority. Ask "does this make the demo land harder?" before writing code.
