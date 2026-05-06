import type { Waypoint } from "../../../shared/schema"

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hashSeed(seed: string) {
  let hash = 2166136261

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function createSeededRandom(seed: string) {
  let state = hashSeed(seed)

  return function random() {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function layoutWaypoints(waypoints: Waypoint[], seed = "default"): Waypoint[] {
  const count = waypoints.length
  const random = createSeededRandom(seed)

  return waypoints.map((waypoint, index) => {
    const t = count === 1 ? 0 : index / (count - 1)
    const y = 0.9 - t * 0.75

    // The mountain art is widest near the base and tight near the summit.
    // This center/radius pair creates an invisible safe lane that follows that shape.
    const centerX = 0.5 - Math.sin(t * Math.PI) * 0.07
    const laneRadius = Math.max(0.08, 0.34 - t * 0.28)
    const minX = centerX - laneRadius
    const maxX = centerX + laneRadius

    const isLast = index === count - 1
    const direction = random() < 0.5 ? -1 : 1
    const strength = 0.25 + random() * 0.65
    const randomOffset = direction * strength
    const rawX = isLast ? 0.5 : centerX + randomOffset * laneRadius
    const x = clamp(rawX, minX, maxX)

    return {
      ...waypoint,
      x,
      y,
    }
  })
}
