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

## Branches

- `main` — only working code
- `mohammed/ai-layer`, `fs1/backend`, `fs2/frontend` — WIP per person

Merge to main only when something works. Voice call stays open the whole time.
