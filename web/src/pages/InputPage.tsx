import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { generateRoute } from "../api"
import SkillInput from "../components/SkillInput"
import StarField from "../components/Starfield";
import Title from "../components/Title";
import { useMountain } from "../lib/MountainContext";

const PAN_DURATION_MS = 2500

function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function InputPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { createMountain } = useMountain()
    const queuedSkill = (location.state as { queuedSkill?: string } | null)?.queuedSkill
    const [isLaunching, setIsLaunching] = useState(Boolean(queuedSkill))
    const [launchedFromQueue, setLaunchedFromQueue] = useState(Boolean(queuedSkill))
    const [error, setError] = useState<string | null>(null)
    const hideIntroDuringLaunch = launchedFromQueue && isLaunching

    const launchRoute = useCallback((skill: string) => {
        setIsLaunching(true)
        setError(null)

        const routeRequest = generateRoute(skill)
        Promise.all([routeRequest, wait(PAN_DURATION_MS)])
            .then(([route]) => {
                createMountain(route)
                navigate("/mountain", { state: {reveal: true } })
            })
            .catch((err: unknown) => {
                console.error("[start] route generation failed", err)
                setError(err instanceof Error ? err.message : "route generation failed")
                setIsLaunching(false)
                setLaunchedFromQueue(false)
            })
    }, [navigate])

    const handleStart = useCallback((skill: string) => {
        if (isLaunching) return
        launchRoute(skill)
    }, [isLaunching, launchRoute])

    useEffect(() => {
        if (!queuedSkill) return
        setLaunchedFromQueue(true)
        navigate(location.pathname, { replace: true, state: null })
        launchRoute(queuedSkill)
    }, [launchRoute, location.pathname, navigate, queuedSkill])

    return (
        <>
        <div className="relative w-full h-screen bg-black overflow-hidden">
            <div className={isLaunching ? "start-camera start-camera-pan" : "start-camera"}>
                <div className="start-stars">
                    <StarField mode={isLaunching ? "descent" : "idle"}></StarField>
                </div>
                <div className="mountain-horizon" />
            </div>

            <div className={isLaunching ? "start-copy start-copy-exit" : "start-copy"}>
                {!hideIntroDuringLaunch && (
                    <>
                        <Title />
                        <div className="relative z-10 w-full max-w-lg px-4">
                            <SkillInput disabled={isLaunching} onSubmit={handleStart}></SkillInput>
                        </div>
                    </>
                )}
                {hideIntroDuringLaunch && (
                    <div className="h-1 w-1 opacity-0" aria-hidden="true" />
                )}
            </div>

            {isLaunching && (
                <div className="start-loading-enter">
                    <p className="text-3xl font-bold tracking-wide text-white">Generating your route...</p>
                </div>
            )}

            {error && (
                <div className="start-error">
                    <p>{error}</p>
                </div>
            )}
        </div>
        </>
    )
}

export default InputPage
