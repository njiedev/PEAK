# PEAK 2.0 Plan

## Vision

PEAK 2.0 turns learning into a visually beautiful climb. A child enters an idea, PEAK generates a mountain route from base camp to summit, and each waypoint is a concrete challenge that moves them higher. The route should feel alive: if the learner gets stuck, the mountain should branch from their current position with a helpful detour that still reaches the peak.

The core product idea is adaptive learning visualized as terrain. The mountain should make progress, struggle, recovery, and mastery visible.

## Current State

PEAK currently has the essential end-to-end loop working:

- A learner enters a skill.
- The backend asks AI to generate a flat route of waypoints.
- The frontend renders one mountain with a fixed visual path.
- The learner opens waypoint challenges, submits work, receives feedback, and advances.
- Progress is stored locally and tied to completed waypoint ids.

This proves the concept, but the system is still shaped like a prototype. Route content is generated, while route geometry is mostly fixed. Progress assumes a linear path. There is no first-class mountain model, route graph, adaptive detour, or persistent scene engine.

## PEAK 2.0 Priorities

### 1. Procedural Route Layout

Replace the fixed switchback path with a route layout generator. The generator should place waypoints on the mountain with visual variety while still obeying learning constraints:

- Start near the base and end at the summit.
- Move generally upward.
- Avoid waypoint overlap.
- Support branch points and detours.
- Produce route geometry that can be stored and replayed.

The first version should stay 2D/2.5D and should not depend on AI for coordinates. AI should generate learning content; deterministic code should generate reliable visual layouts.

### 2. Route Graph Model

Move from a flat `route: Waypoint[]` model toward a graph:

- `Mountain` represents a topic or learning journey.
- `Waypoint` represents a challenge/concept.
- `RouteEdge` represents the visible path between waypoints.
- `Attempt` records submissions and outcomes.
- `AdaptationEvent` records why a route changed.

This enables multiple paths, support branches, optional review nodes, and route history without hacking around array indexes.

### 3. Adaptive Detours

When a learner struggles, PEAK should generate a new route segment from their current waypoint. A first practical trigger is three failed or low-confidence attempts on one waypoint.

The detour should:

- Begin from the learner's current location.
- Add one to three support waypoints.
- Target the same summit or rejoin the main path.
- Use a different teaching style, smaller step, prerequisite review, or alternate challenge format.
- Visually branch from the mountain instead of replacing the whole route.

### 4. Multiple Mountains

Support several active learning journeys at once. Each mountain should represent a skill, topic, project, or course. A learner should be able to leave one climb and return later without losing progress.

The initial version can keep persistence local, but the data model should make future account-backed persistence straightforward.

### 5. Seamless Scene and Camera Layer

The mountain should feel like one continuous place. React rerenders and route changes should not visually reset the world.

The scene layer should own:

- Camera position and zoom.
- Route drawing and trail reveal.
- Waypoint animation state.
- Character position.
- Atmospheric effects.

React should continue to own forms, panels, navigation, and challenge UI.

### 6. Character and XP

Add a climber character once the route and scene foundations are stable. The character should travel along the route, pause at waypoints, and make progress feel embodied.

XP should reward meaningful learning behavior:

- Completing waypoints.
- Recovering after a struggle.
- Revisiting weak concepts.
- Finishing a mountain.
- Maintaining consistency.

XP should support the learning loop, not become generic gamification.

### 7. Dev-Only Demo and Cheat Mode

PEAK should have a development-only control surface for testing progression, animations, submissions, and AI prompts without corrupting product logic. This should be treated as tooling, not user-facing functionality.

The mode should support:

- Completing and uncompleting any waypoint.
- Jumping the active waypoint forward or backward.
- Resetting a route, a single waypoint, or all local PEAK state.
- Replaying route reveal, trail-fill, waypoint-complete, detour, and summit animations.
- Re-evaluating a submission without changing the original answer.
- Editing or reprompting waypoint content during development.
- Forcing an adaptive detour trigger from the current waypoint.
- Loading stable canned routes for animation QA.

Implementation should be gated behind development-only checks such as `import.meta.env.DEV` or an explicit `VITE_ENABLE_DEV_TOOLS=true` flag. No demo controls, shortcuts, or forced pass behavior should ship as normal product behavior.

Build this after the route graph and state boundaries exist, but before heavy animation polish. That timing makes the tooling useful for testing the most fragile flows without baking temporary hacks into production code.

## Visual Technology Direction

PEAK should become an illustrated 2.5D interactive map before attempting full 3D.

Recommended stack:

- **React:** app shell, panels, challenge forms, state orchestration.
- **SVG:** route paths, waypoints, labels, hit targets, branch geometry, and trail glow.
- **Canvas:** atmosphere, particles, fog, snow, weather, subtle lighting, and character motion.
- **Layered bitmap assets:** mountain, sky, foreground, clouds, and environmental depth.

Avoid Three.js for the next phase. Full 3D can be revisited later, but the stronger near-term portfolio move is a polished 2.5D mountain that feels intentional, performant, and alive.

## Milestones

### Milestone 1: Foundation Cleanup and Domain Model

- Remove remaining demo-only assumptions.
- Define the future route graph model.
- Separate learning state from scene/camera state.
- Define where development tooling can read and mutate state without becoming product logic.
- Keep the current app working while preparing for graph-based routes.

### Milestone 2: Procedural Visual Route Generation

- Generate route coordinates and path segments from constraints.
- Render stored geometry instead of hardcoded path slots.
- Animate the route being drawn from base camp to summit.
- Preserve the existing waypoint challenge flow.

### Milestone 3: Adaptive Rerouting

- Track attempts per waypoint.
- Detect struggle states.
- Generate support waypoints and branch geometry.
- Rejoin the original route or continue toward the same summit.

### Milestone 4: Multiple Mountains and Progression

- Introduce a mountain selection/progress view.
- Persist multiple active climbs.
- Track per-mountain completion, attempts, and route history.

### Milestone 4.5: Development Tools

- Add a hidden developer panel or route such as `/dev`.
- Provide controls to complete, uncomplete, jump, reset, replay, and force detours.
- Add canned route fixtures for visual QA and regression testing.
- Keep all controls gated to development builds or an explicit local env flag.

### Milestone 5: Animation Polish and Character Layer

- Add a climber character.
- Smooth camera motion between base, active waypoint, branch, and summit.
- Add atmosphere and foreground motion through Canvas.
- Eliminate visible rerender resets.

### Milestone 6: Optional Model Strategy

- Keep deterministic route geometry free and local.
- Use AI for learning content, hints, feedback, and detour generation.
- Explore lower-cost or local model options later for non-critical generation tasks.

## Success Criteria

PEAK 2.0 should feel portfolio-impressive because it combines product thinking, visual craft, AI integration, and adaptive learning architecture.

A successful version lets a reviewer see:

- A beautiful generated mountain route.
- A learner progressing through real tasks.
- A route changing when the learner struggles.
- A clear technical path from prototype to robust product.

The goal is not to add features everywhere. The goal is to make the learning path feel like a living mountain.
