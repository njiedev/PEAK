import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { generateRoute } from "../api"
import type { Route } from "../../../shared/schema"

type MountainLocationState = {
    skill?: string
    route?: Route
}

function MountainPage() {
    const location = useLocation()
    const navigationState = location.state as MountainLocationState | null
    const skill = navigationState?.skill
    const initialRoute = navigationState?.route ?? null
    const [route, setRoute] = useState<Route | null>(initialRoute)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!skill) {
            console.log("[mountain] no skill in navigation state")
            return
        }
        if (initialRoute) {
            console.log("[mountain] using generated route from start transition", {
                skill: initialRoute.skill,
                waypoints: initialRoute.route.length,
            })
            setRoute(initialRoute)
            return
        }

        let isCurrent = true
        console.log("[mountain] loading route", { skill })
        setRoute(null)
        setError(null)

        generateRoute(skill)
            .then((generatedRoute) => {
                console.log("[mountain] route resolved", {
                    isCurrent,
                    skill: generatedRoute.skill,
                    waypoints: generatedRoute.route.length,
                })
                if (isCurrent) setRoute(generatedRoute)
            })
            .catch((err: unknown) => {
                if (!isCurrent) return
                console.error("[mountain] route failed", err)
                setError(err instanceof Error ? err.message : "route generation failed")
            })

        return () => {
            console.log("[mountain] route effect cleanup", { skill })
            isCurrent = false
        }
    }, [skill, initialRoute])

    if (!skill) {
        return (
            <div className="w-full h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <p className="text-xl">Choose a skill first.</p>
                <Link to="/start" className="rounded px-4 py-2 bg-white text-black font-bold">
                    Back
                </Link>
            </div>
        )
    }

    return (
        <>
        <div className="relative w-full min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-8 overflow-hidden">
            {!route && !error && <div className="relative z-10 text-3xl font-bold">loading</div>}

            {error && (
                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                    <p className="text-2xl font-bold">Something went wrong.</p>
                    <p className="max-w-lg text-white/75">{error}</p>
                    <Link to="/start" className="rounded px-4 py-2 bg-white text-black font-bold">
                        Try again
                    </Link>
                </div>
            )}

            {route && (
                <div className="relative z-10 w-full max-w-2xl route-results-enter">
                    <h1 className="text-4xl font-bold mb-2">{route.skill}</h1>
                    <p className="text-white/70 mb-6">{route.estimatedHours} hour route</p>
                    <ul className="space-y-3">
                        {route.route.map((waypoint) => (
                            <li key={waypoint.id} className="border border-white/25 rounded px-4 py-3">
                                {waypoint.title}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
        </>
    )
}

export default MountainPage
