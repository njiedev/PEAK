# PEAK

AI-generated interactive learning app for kids, built around a mountain climbing metaphor. BeaverHacks 2026.

## Structure

- `shared/` — the JSON contract between all parts
- `ai/` — Claude prompts and route generation (owned by Mohammed)
- `server/` — Express API (owned by FS1)
- `web/` — React frontend (owned by FS2)

## Read first

- `PRD.md` — full product context
- `CLAUDE.md` — rules for AI sessions
- `<folder>/CLAUDE.md` — per-role context

## Demo cache

Run this before a live demo:

```sh
npm run demo:seed-cache
```

That prewarms the exact demo skills listed in `ai/demoSkills.ts` into `ai/cache/`. The summit-animation demo input is:

```txt
i want to start a minecraft server
```

That exact route is cached at `ai/cache/i-want-to-start-a-minecraft-server.json`. The frontend treats it as the summit demo route and marks every waypoint complete except the final one, whose challenge is `type abc`, so the last submit can trigger the reaching-the-summit animation predictably.

## Branches

- `main` — only working code
- `mohammed/ai-layer`, `fs1/backend`, `fs2/frontend` — WIP per person

Merge to main only when something works. Voice call stays open the whole time.
