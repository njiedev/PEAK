// Hand-tuned positions traced along the visible climbing route on
// `mountain.png`. Values are 0-1 normalized to the image.
export const PATH_POSITIONS: { x: number; y: number }[] = [
    { x: 0.16, y: 0.88 },
    { x: 0.27, y: 0.74 },
    { x: 0.36, y: 0.62 },
    { x: 0.44, y: 0.50 },
    { x: 0.50, y: 0.40 },
    { x: 0.58, y: 0.30 },
    { x: 0.55, y: 0.20 },
    { x: 0.52, y: 0.10 },
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
