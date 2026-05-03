import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { generateRoute } from "../api"
import SkillInput from "../components/SkillInput"
import StarField from "../components/Starfield";
import Title from "../components/Title";

const PAN_DURATION_MS = 2500

function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function InputPage() {
    const navigate = useNavigate()
    const [isLaunching, setIsLaunching] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleStart(skill: string) {
        if (isLaunching) return

        setIsLaunching(true)
        setError(null)

        const routeRequest = generateRoute(skill)
        Promise.all([routeRequest, wait(PAN_DURATION_MS)])
            .then(([route]) => {
                navigate("/mountain", { state: { skill, route } })
            })
            .catch((err: unknown) => {
                console.error("[start] route generation failed", err)
                setError(err instanceof Error ? err.message : "route generation failed")
                setIsLaunching(false)
            })
    }

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
                <h1 className='text-9xl font-bold text-white'>PEAK</h1>
                <p className="text-white">this is what peak is about</p>
                <div className="relative z-10 w-full max-w-lg px-4">
                    <SkillInput disabled={isLaunching} onSubmit={handleStart}></SkillInput>
                </div>
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
