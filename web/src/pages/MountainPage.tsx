import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { generateRoute } from "../api"
import type { Route, Waypoint as WaypointData } from "../../../shared/schema"
import Waypoint from "../components/Waypoint"
import mountainImg from "../assets/mountain.png"
import { pickPosition } from "../lib/pathMath"
import { useProgress } from "../lib/ProgressContext"
import mountainImg from "../assets/mountain2.png"
import SkyBackground from "../components/SkyBackground"

type MountainLocationState = {
    skill?: string
    route?: Route
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
            {route && (
                <div className="absolute inset-0 z-10">
                    {route.route.map((wp, i) => {
                        const pos = pickPosition(i, route.route.length)
                        const completed = isCompleted(wp.id)
                        const isActive = i === activeIndex
                        
                        const state =
                            completed ? "completed" :
                            isActive ? "active" : "far"
                        
                        return (
                            <div
                                key={wp.id}
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
                            >
                                <Waypoint
                                    state={state}
                                    size={state === "active" ? 110 : 80}
                                    onClick={() => openWaypoint(wp, i)}
                                />
                            </div>
                        )
                    })}
                </div>
            )}

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
