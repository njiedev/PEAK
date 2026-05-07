# PEAK
https://www.youtube.com/watch?v=LJLqLSbx44Y
PEAK is an AI-generated learning app that turns a child's goal into an interactive climb up a mountain. A learner enters something they want to learn, PEAK generates a sequence of hands-on challenges, and each completed waypoint moves them higher toward the summit.

The project started as a hackathon prototype and is being rebuilt into a portfolio-grade product focused on adaptive learning, visual progression, and a polished 2.5D mountain experience.

## Why It Is Interesting

Most AI tutoring interfaces feel like chat logs or static lesson lists. PEAK explores a more spatial learning model: progress is visible, memorable, and emotionally tied to an expedition. The mountain is not just decoration; it is the interface for planning, motivation, and eventually adaptation.

The long-term goal is for the route itself to respond to the learner. If a child struggles, PEAK should generate a helpful detour from their current position instead of simply marking the answer wrong.

## Current Features

- Skill input flow that generates a personalized learning route.
- AI-authored waypoints with concrete challenges.
- Mountain view with animated reveal, route trail, and clickable campfire waypoints.
- Waypoint detail screen with text and file/photo submission support.
- AI feedback and pass/fail evaluation for submissions.
- Local progress tracking by route.
- End-of-route celebration with basic journey stats.
- File-backed route cache to avoid regenerating the same route repeatedly.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS.
- **Backend:** Node.js, Express, Zod request validation.
- **AI:** Anthropic-powered route generation and submission evaluation.
- **Shared contract:** TypeScript route, waypoint, challenge, and feedback types in `shared/`.
- **Caching:** Local file-backed cache for generated routes in `ai/cache/`.

## Architecture

```txt
PEAK
├── ai/       Prompting, route generation, validation, and feedback evaluation
├── server/   Express API wrapping the AI layer
├── shared/   TypeScript types shared across frontend, backend, and AI code
└── web/      React app, mountain scene, waypoint UI, and submission flow
```

The frontend calls the server through two primary endpoints:

- `POST /api/generate-route` creates or retrieves a route for a skill.
- `POST /api/evaluate-submission` evaluates a learner's answer for a waypoint.

The AI layer validates generated JSON before it reaches the frontend, keeping the app behavior tied to a typed route contract.

## Visual Direction

The current experience uses React, CSS animation, a mountain image, SVG route overlays, and absolutely positioned waypoint components. That was enough to prove the core idea.

The PEAK 2.0 direction is a richer illustrated mountain system:

- React for the app shell and learning UI.
- SVG for route paths, waypoint hit targets, labels, and trail effects.
- Canvas for atmosphere, particles, fog, weather, and character motion.
- Layered 2.5D mountain assets before considering full 3D.

This keeps the product visually ambitious while avoiding the complexity of a full game engine too early.

## Roadmap

See [PLAN.md](./PLAN.md) for the PEAK 2.0 roadmap. The main upcoming work is to replace the current single fixed route with procedural route layouts, then evolve the flat route array into a graph that supports adaptive detours and multiple active mountains.

## Local Development

Install dependencies in each package:

```sh
npm install
cd server && npm install
cd ../web && npm install
```

Create a root `.env` file with:

```sh
ANTHROPIC_API_KEY=your_key_here
```

Run the backend:

```sh
cd server
npm run dev
```

Run the frontend in a second terminal:

```sh
cd web
npm run dev
```

By default, the frontend expects the API at `http://localhost:3001`. Set `VITE_API_URL` in `web/.env` if the server is running elsewhere.

## Validation

Build the frontend:

```sh
cd web
npm run build
```

Typecheck the server:

```sh
cd server
npm run build
```

## Status

PEAK is an evolving portfolio project. The current version demonstrates the end-to-end learning loop and visual metaphor; the next version focuses on procedural route generation, adaptive learning paths, and a more seamless animated mountain scene.
