import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { generateRoute } from "../api"
import type { Route, Waypoint as WaypointData } from "../../../shared/schema"
import Waypoint from "../components/Waypoint"
// import { pickPosition } from "../lib/pathMath"
import { useProgress } from "../lib/ProgressContext"
import mountainImg from "../assets/mountain2.png"
import SkyBackground from "../components/SkyBackground"

type MountainLocationState = {
    skill?: string
    route?: Route
}

// Switchback route up mountain.png. y is evenly spaced (~0.09 per step)
// so campfires don't clump near the top. x swings wide, using the right
// shoulder of the mountain (up to 0.72), narrowing naturally to the peak.
const PATH_POSITIONS: { x: number; y: number }[] = [
    { x: 0.18, y: 0.83 },  // base: far left foothills
    { x: 0.72, y: 0.74 },  // traverse far right — uses right side of mountain
    { x: 0.26, y: 0.64 },  // switchback far left
    { x: 0.68, y: 0.55 },  // traverse right, mid-mountain
    { x: 0.35, y: 0.46 },  // switchback left
    { x: 0.59, y: 0.37 },  // traverse right, upper slope
    { x: 0.44, y: 0.27 },  // switchback toward center
    { x: 0.50, y: 0.18 },  // summit
]

function pickPosition(index: number, total: number) {
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

// Catmull-Rom → cubic bezier. Produces a smooth SVG path through every point.
function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return ""
    const p = pts.map(pt => [pt.x * 100, pt.y * 100])
    let d = `M ${p[0][0].toFixed(2)},${p[0][1].toFixed(2)}`
    for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[Math.max(0, i - 1)]
        const p1 = p[i]
        const p2 = p[i + 1]
        const p3 = p[Math.min(p.length - 1, i + 2)]
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6
        d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`
    }
    return d
}

function MountainPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const navigationState = location.state as MountainLocationState | null
    const skill = navigationState?.skill
    const initialRoute = navigationState?.route ?? null
    const [route, setRoute] = useState<Route | null>(initialRoute)
    const [error, setError] = useState<string | null>(null)
    
    const { activeIndex, isCompleted } = useProgress()

    useEffect(() => {
        if (!skill) return
        if (initialRoute) {
            setRoute(initialRoute)
            return
        }

        let isCurrent = true
        setRoute(null)
        setError(null)

        generateRoute(skill)
            .then((generatedRoute) => {
                if (isCurrent) setRoute(generatedRoute)
            })
            .catch((err: unknown) => {
                if (!isCurrent) return
                setError(err instanceof Error ? err.message : "route generation failed")
            })

        return () => { isCurrent = false }
    }, [skill, initialRoute])

    function openWaypoint(waypoint: WaypointData, index: number) {
        const pos = pickPosition(index, route?.route.length ?? 1)
        navigate("/detail", {
            state: {
                waypoint,
                index,
                total: route?.route.length,
                skill: route?.skill,
                focus: pos,
                fullRoute: route,
                activeIndex,
            },
        })
    }

    if (!skill) {
        return (
            <div className="w-full h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <p className="text-xl">Choose a skill first.</p>
                <Link to="/" className="rounded px-4 py-2 bg-white text-black font-bold">
                    Back
                </Link>
            </div>
        )
    }

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-[#0a0a0f] text-white">
            <SkyBackground></SkyBackground>
            {/* mountain background */}
            <img
                src={mountainImg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
            />
            {/* subtle vignette so waypoints pop */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
                }}
            />

            {/* trail + waypoints layer */}
            {route && (() => {
                const positions = route.route.map((_, i) => pickPosition(i, route.route.length))
                const ghostPath = smoothPath(positions)
                const donePath = activeIndex > 0 ? smoothPath(positions.slice(0, activeIndex + 1)) : null
                return (
                    <div className="absolute inset-0 z-10">
                        {/* SVG trail — rendered below campfires */}
                        <svg
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                {/* Punch a hole at every campfire centre so the trail
                                    never overlaps the campfire graphic. rx/ry compensate
                                    for non-uniform scaling of preserveAspectRatio="none". */}
                                <mask id="trail-campfire-mask">
                                    <rect width="100" height="100" fill="white" />
                                    {positions.map((pos, i) => (
                                        <ellipse
                                            key={i}
                                            cx={pos.x * 100}
                                            cy={pos.y * 100}
                                            rx={3}
                                            ry={4.5}
                                            fill="black"
                                        />
                                    ))}
                                </mask>
                            </defs>
                            <path
                                d={ghostPath}
                                mask="url(#trail-campfire-mask)"
                                fill="none"
                                stroke="rgba(255,255,255,0.22)"
                                strokeWidth="0.55"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="1.5 2.2"
                            />
                            {donePath && (
                                <path
                                    d={donePath}
                                    mask="url(#trail-campfire-mask)"
                                    fill="none"
                                    stroke="rgba(245,158,11,0.9)"
                                    strokeWidth="0.65"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}
                        </svg>

                        {/* campfires — rendered above trail */}
                        {positions.map((pos, i) => {
                            const wp = route.route[i]
                            const state =
                                i < activeIndex ? "completed" :
                                i === activeIndex ? "active" : "far"
                            return (
                                <div
                                    key={wp.id}
                                    className="absolute -translate-x-1/2 -translate-y-1/2"
                                    style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
                                >
                                    <Waypoint
                                        state={state}
                                        size={state === "active" ? 110 : 80}
                                        label={`${i + 1}`}
                                        onClick={() => openWaypoint(wp, i)}
                                    />
                                </div>
                            )
                        })}
                    </div>
                )
            })()}

            {/* header */}
            <header className="relative z-20 flex items-center justify-between px-8 py-5">
                <Link to="/" className="text-sm text-white/70 hover:text-white">
                    ← back
                </Link>
                {route && (
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                            Your route
                        </p>
                        <h1 className="text-xl font-bold">{route.skill}</h1>
                        <p className="text-xs text-white/50">
                            {route.estimatedHours} hour climb · {route.route.length} waypoints
                        </p>
                    </div>
                )}
            </header>

            {/* loading */}
            {!route && !error && (
                <div className="relative z-10 flex h-[80vh] items-center justify-center">
                    <p className="text-3xl font-bold">loading the mountain...</p>
                </div>
            )}

            {/* error */}
            {error && (
                <div className="relative z-10 flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
                    <p className="text-2xl font-bold">Something went wrong.</p>
                    <p className="max-w-lg text-white/75">{error}</p>
                    <Link to="/" className="rounded px-4 py-2 bg-white text-black font-bold">
                        Try again
                    </Link>
                </div>
            )}
        </div>
    )
}

export default MountainPage
