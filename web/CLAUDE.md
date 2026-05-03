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

### Hour 8-12: The opening reveal animation

This is the money moment of the entire demo. It runs **once**, right after the route is generated, before the user has done anything. The sequence:

1. **Hold on the peak (~0.8s).** Camera starts zoomed in tight on the *summit* of the mountain — the final waypoint, the destination. The user sees their goal first. Optionally a small text overlay like "Your goal" or just the peak waypoint glowing.
2. **Pull back (~1.5s).** Camera smoothly zooms out from scale ~2.0 down to scale 1.0, revealing the full mountain and the entire route winding from base to summit. Use an ease-out curve so it feels like it's "settling" into the wide view, not just shrinking linearly.
3. **Settle on active waypoint (~0.5s).** Camera then zooms back in partially (scale ~1.3) and pans to the user's current waypoint (waypoint 1 for a new user). That waypoint pulses or glows to mark it active. Other waypoints are visible but dimmed (~40% opacity).

Implement with framer-motion's `animate` controls or a sequence of CSS transitions. The `transform-origin` shifts between phases — peak position for the pull-back, active waypoint position for the settle. You can do this by wrapping the mountain SVG in a `<motion.div>` and animating both `scale` and `transformOrigin` together.

Critical details:
- Skip-able. Click anywhere or press space to fast-forward to the active waypoint state. Judges might want to demo without waiting through the animation a second time.
- Runs only on first load of a route. Subsequent waypoint completions just transfer the highlight to the next waypoint — no full reveal again.
- Active waypoint highlight is a separate persistent visual state (pulsing glow ring around the circle), not part of the reveal animation. The reveal ends with the highlight already visible.

Test this with mock data over and over until it feels right. This is what the judges will remember.

### Hour 12-14: Active waypoint highlight + transitions

The active waypoint (the one the user should tackle next) is visually distinct at all times:

- Larger than other waypoints (~1.4x)
- Has a soft pulsing glow ring (CSS animation, 2s cycle)
- Full opacity color, while completed waypoints show their trail color and uncompleted future waypoints are dimmed
- When clicked, opens the challenge card

When a challenge is completed:
- Current waypoint snaps to "completed" state (trail color, no pulse)
- Trail fills forward to the next waypoint (the dasharray animation)
- Next waypoint scales up and starts pulsing — it's now active
- Optional: brief camera pan to the new active waypoint (~0.4s)

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

If the opening reveal doesn't feel right, iterate. This is the most important visual moment in the entire app and it's worth spending an extra hour on.

## Definition of done

The user can: type a skill → watch the opening reveal (zoomed on peak → pull back to full mountain → settle on active waypoint with highlight) → click the active waypoint → fill out the challenge → submit → see Claude's feedback → close the card → see the trail extend → see the highlight transfer to the next waypoint → click that one. All of this works smoothly, looks polished, and runs in under 60 seconds.