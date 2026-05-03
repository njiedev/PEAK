import { useEffect, useState, type CSSProperties } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { generateRoute } from "../api"
import type { Route, Waypoint as WaypointData } from "../../../shared/schema"
import Waypoint from "../components/Waypoint"
import StarField from "../components/Starfield"
import mountainImg from "../assets/mountain2.png"
import { pickPosition } from "../lib/pathMath"
import { useProgress } from "../lib/ProgressContext"

type MountainLocationState = {
    skill?: string
    route?: Route
    reveal?: boolean
}

const REVEAL_DURATION_MS = 7200

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
    const [revealing, setRevealing] = useState(Boolean(navigationState?.reveal && initialRoute))

    const { activeIndex, isCompleted } = useProgress()

    useEffect(() => {
        if (!revealing) return
        // Clear the reveal flag from history so navigating back here doesn't replay it.
        navigate(location.pathname, {
            replace: true,
            state: { ...(navigationState ?? {}), reveal: false },
        })
        const t = window.setTimeout(() => setRevealing(false), REVEAL_DURATION_MS)
        return () => window.clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const peakPos = route ? pickPosition(route.route.length - 1, route.route.length) : { x: 0.5, y: 0.18 }

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
        <div className="relative w-full min-h-screen">
            <div
                className={revealing ? "mountain-reveal-stage absolute inset-0" : "absolute inset-0"}
                style={revealing ? ({ ["--peak-x"]: peakPos.x, ["--peak-y"]: peakPos.y } as CSSProperties) : undefined}
            >
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
            </div>

            {/* reveal overlay — black + descending stars covering everything, fades out */}
            {revealing && (
                <div className="mountain-reveal-overlay">
                    <StarField mode="descent" />
                </div>
            )}

            {/* peak title shown during the reveal hold */}
            {revealing && route && (
                <h1 className="mountain-reveal-title text-5xl md:text-7xl font-bold tracking-tight px-6">
                    {route.skill}
                </h1>
            )}

            {/* header */}
            <header className={(revealing ? "mountain-reveal-chrome " : "") + "relative z-20 flex items-center justify-between px-8 py-5"}>
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
