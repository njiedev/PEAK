# PEAK — React App & Mountain (Full Stacker 2)

You own everything the user sees. The skill input screen, the mountain, the route, the waypoints, the challenge cards, the zoom-out reveal, all of it. This is the highest-visibility piece of the project. The judge's eyes are on your code for 60 seconds straight.

## What lives in this directory

```
web/
├── CLAUDE.md                  ← you are here
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── src/
│   ├── App.tsx                ← top-level routing + state
│   ├── api.ts                 ← fetch wrappers for the backend
│   ├── mockRoute.ts           ← copied from ai/mockRoute.ts for dev
│   ├── screens/
│   │   ├── SkillInput.tsx     ← the first screen
│   │   └── Mountain.tsx       ← the main experience
│   ├── components/
│   │   ├── MountainSVG.tsx    ← the SVG illustration + path + waypoints
│   │   ├── Waypoint.tsx       ← a single clickable point on the route
│   │   ├── ChallengeCard.tsx  ← the modal that opens on click
│   │   └── FeedbackPanel.tsx  ← Claude's response after submission
│   └── lib/
│       └── pathMath.ts        ← arc-length interpolation helpers
```

## Your job, concretely

### Hour 1-2: Scaffold + lock the look

- Vite + React + TypeScript + Tailwind + shadcn already configured (use Mohammed's starter template if available)
- Get `App.tsx` rendering a simple two-screen flow: skill input → mountain
- Drop in `mockRoute.ts` (copied from `ai/`) and use it everywhere until the API is real
- Pick the visual style early. Hand-drawn / illustrated / paper-textured / kid-friendly is the brief. Not corporate, not Material, not Figma defaults.

### Hour 2-8: The mountain

This is the hardest visual piece. Approach:

1. **Mountain background.** Use a single static illustration — find one on kenney.nl, OpenGameArt, or generate one with the demo guy. Don't waste hours making this dynamic. SVG or PNG, doesn't matter, but SVG is preferable for crisp scaling.

2. **The route path.** Hand-author an SVG `<path>` that winds up the mountain. Bezier curves. Save it as a string in `pathMath.ts`. This is the spine of the entire experience.

3. **Waypoint placement.** Use the `getPointAtLength` API on SVG path elements to lay waypoints along the path at evenly-spaced (or difficulty-weighted) intervals. The route JSON has `x`/`y` hints from the AI but you can override with arc-length math for prettier results.

4. **Click handling.** Each waypoint is an SVG `<circle>` (or a small `<g>` with an icon) with an `onClick` that opens the challenge card.

5. **Trail fill.** The path is two overlaid SVG paths: a faint grey "planned" route always visible, and a vivid "completed" route that grows in length as waypoints are completed. Use `stroke-dasharray` and `stroke-dashoffset` to animate the trail growing.

### Hour 8-12: The zoom-out reveal

The money moment. When the first waypoint completes:

- The mountain SVG container scales from `1.5` (zoomed in on the first waypoint) down to `1.0` (full mountain visible)
- Use a CSS transition or framer-motion (already in shadcn-friendly stacks) over ~1.5 seconds
- The `transform-origin` is the position of the first waypoint, so the zoom feels like it's "pulling back" from where they were
- Add a subtle camera shake or ease for drama

Test this with mock data over and over until it feels right. This is the demo's emotional peak.

### Hour 12-16: Challenge card + feedback

- Card appears as an overlay with a backdrop blur when a waypoint is clicked
- Shows the waypoint title, summary, and challenge prompt
- Has a text input (or photo upload, if photo type)
- Submit button calls `POST /api/evaluate-submission` via `api.ts`
- While loading, show a friendly spinner — "Asking the guide..." or similar
- On response, show the feedback in a separate panel
- Close button returns to the mountain, with the waypoint marked complete and the trail extended

### Hour 16+: Polish

- Onboarding text on the input screen
- Empty states ("hmm, the mountain guide didn't catch that, try again")
- Sounds if you have time (delicate — don't overdo it)
- Mobile responsive (the demo is on a laptop but judges sometimes ask for the URL)

## What others are working on (just enough context)

- **AI layer (Mohammed)** is generating the route JSON and the feedback messages. You don't talk to them directly — you talk to their output via the backend's HTTP endpoints. Their JSON shape is locked in `shared/schema.ts`. Trust it.

- **Backend (FS1)** is exposing two endpoints: `POST /api/generate-route` and `POST /api/evaluate-submission`. Both return `{ ok: true, data: ... }` on success or `{ ok: false, error: string }` on failure. They're running on `http://localhost:3001` in dev and on a Railway/Render URL in prod. Use `import.meta.env.VITE_API_URL` to switch between them.

- **Demo guy** is making the pitch deck and finding mountain art, climber sprites, and any other assets you need. If you need an asset, ask them. They're also rehearsing the demo script — give them feedback on which screens they should land on for which beats.

## Hard rules

- **No game engines.** No Phaser, no Pixi, no Three. Pure SVG + CSS transforms. You've been told this.
- **Don't change the JSON schema.** It's in `shared/schema.ts`. If you need a field, ask Mohammed and FS1 on voice before changing.
- **Don't call the Anthropic API directly.** Always go through the backend.
- **Don't start with the API.** Build everything against `mockRoute.ts` first. Swap in the real API last.
- **No CSS-in-JS libraries.** Tailwind only.
- **One overlay at a time.** If a challenge card is open, the mountain is hidden behind a backdrop. No overlapping modals.

## When you're blocked

If the API is slow or broken, you're on mock data and that's fine. The demo can run entirely on local mocks if FS1's deploy fails — wire a flag in `api.ts` that returns the mock instead of fetching.

If the SVG path math gets gnarly, ask Mohammed for help. Path interpolation is well-trodden territory and there's example code online.

If the zoom-out doesn't feel right, iterate. This is the most important visual moment in the entire app and it's worth spending an extra hour on.

## Definition of done

The user can: type a skill → see the mountain zoomed in on the first waypoint → click that waypoint → fill out the challenge → submit → see Claude's feedback → close the card → see the trail extend → see the camera zoom out and reveal the full route → click the next waypoint. All of this works smoothly, looks polished, and runs in under 60 seconds.
