// Switchback route up mountain2.png. y is evenly spaced (~0.09 per step)
// so campfires don't clump near the top. x swings wide, using the right
// shoulder of the mountain (up to 0.72), narrowing naturally to the peak.
export const PATH_POSITIONS: { x: number; y: number }[] = [
    { x: 0.18, y: 0.83 },
    { x: 0.72, y: 0.74 },
    { x: 0.26, y: 0.64 },
    { x: 0.68, y: 0.55 },
    { x: 0.35, y: 0.46 },
    { x: 0.59, y: 0.37 },
    { x: 0.44, y: 0.27 },
    { x: 0.50, y: 0.18 },
]

export function pickPosition(index: number, total: number) {
    if (total <= PATH_POSITIONS.length) {
        return PATH_POSITIONS[Math.min(index, PATH_POSITIONS.length - 1)]
    }
    // if more waypoints than slots, lerp between first and last
    const t = index / (total - 1)
    const slot = t * (PATH_POSITIONS.length - 1)
    const lo = Math.floor(slot)
    const hi = Math.min(lo + 1, PATH_POSITIONS.length - 1)
    const f = slot - lo
    return {
        x: PATH_POSITIONS[lo].x + (PATH_POSITIONS[hi].x - PATH_POSITIONS[lo].x) * f,
        y: PATH_POSITIONS[lo].y + (PATH_POSITIONS[hi].y - PATH_POSITIONS[lo].y) * f,
    }
}
