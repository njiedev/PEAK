import { useEffect, useRef, useState, type CSSProperties } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import type { Detour, Waypoint as WaypointData } from "../../../shared/schema"
import Waypoint from "../components/Waypoint"
import StarField from "../components/Starfield"
import SkillInput from "../components/SkillInput"
import mountainImg from "../assets/mountain2.png"
import { pickPosition } from "../lib/pathMath"
import { useProgress } from "../lib/ProgressContext"
import { readActiveDetours, routeStorageScope } from "../lib/detours"
import { useMountain } from "../lib/MountainContext"

type MountainLocationState = {
    reveal?: boolean
}

const REVEAL_DURATION_MS = 7200
const SKY_SELECTION_HOLD_MS = 900
const SKY_DESCENT_OVERLAY_MS = 1200
const LOGIN_STREAK_STORAGE_KEY = "peak_login_streak"
const JOURNEY_STATS_STORAGE_KEY_PREFIX = "peak_journey_stats"
const ENDGAME_SEEN_STORAGE_KEY_PREFIX = "peak_endgame_seen"

function journeyStatsKey(scope: string): string {
    return `${JOURNEY_STATS_STORAGE_KEY_PREFIX}_${scope}`
}

function endgameSeenKey(scope: string): string {
    return `${ENDGAME_SEEN_STORAGE_KEY_PREFIX}_${scope}`
}

type LoginStreak = {
    count: number
    lastLoginDate: string
    highestCount: number
}

type JourneyStats = {
    totalAttempts: number
    longestTaskMs: number
    shortestTaskMs: number | null
}

function localDateKey(date = new Date()): string {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, "0")
    const day = `${date.getDate()}`.padStart(2, "0")
    return `${year}-${month}-${day}`
}

function daysBetween(startDateKey: string, endDateKey: string): number | null {
    const [startYear, startMonth, startDay] = startDateKey.split("-").map(Number)
    const [endYear, endMonth, endDay] = endDateKey.split("-").map(Number)

    if (
        !startYear || !startMonth || !startDay ||
        !endYear || !endMonth || !endDay
    ) {
        return null
    }

    const start = new Date(startYear, startMonth - 1, startDay)
    const end = new Date(endYear, endMonth - 1, endDay)
    return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

function readLoginStreak(): LoginStreak {
    const today = localDateKey()
    const fallback = { count: 1, lastLoginDate: today, highestCount: 1 }

    try {
        const saved = window.localStorage.getItem(LOGIN_STREAK_STORAGE_KEY)
        if (!saved) return fallback

        const parsed = JSON.parse(saved) as Partial<LoginStreak>
        const previousCount = Number.isFinite(parsed.count) ? Number(parsed.count) : 0
        const previousHighest = Number.isFinite(parsed.highestCount) ? Number(parsed.highestCount) : previousCount
        const previousDate = typeof parsed.lastLoginDate === "string" ? parsed.lastLoginDate : ""
        const elapsedDays = daysBetween(previousDate, today)

        if (elapsedDays === 0) {
            const count = Math.max(1, previousCount)
            return { count, lastLoginDate: today, highestCount: Math.max(count, previousHighest) }
        }

        if (elapsedDays === 1) {
            const count = Math.max(1, previousCount) + 1
            return { count, lastLoginDate: today, highestCount: Math.max(count, previousHighest) }
        }

        return fallback
    } catch {
        return fallback
    }
}

function readJourneyStats(scope: string): JourneyStats {
    try {
        const saved = window.localStorage.getItem(journeyStatsKey(scope))
        if (!saved) return { totalAttempts: 0, longestTaskMs: 0, shortestTaskMs: null }

        const parsed = JSON.parse(saved) as Partial<JourneyStats>
        return {
            totalAttempts: Number.isFinite(parsed.totalAttempts) ? Number(parsed.totalAttempts) : 0,
            longestTaskMs: Number.isFinite(parsed.longestTaskMs) ? Number(parsed.longestTaskMs) : 0,
            shortestTaskMs: Number.isFinite(parsed.shortestTaskMs) ? Number(parsed.shortestTaskMs) : null,
        }
    } catch {
        return { totalAttempts: 0, longestTaskMs: 0, shortestTaskMs: null }
    }
}

function formatDuration(ms: number | null): string {
    if (ms === null || ms <= 0) return "Not yet"

    const totalSeconds = Math.max(1, Math.round(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    if (minutes === 0) return `${seconds}s`
    if (seconds === 0) return `${minutes}m`
    return `${minutes}m ${seconds}s`
}

// Catmull-Rom → cubic bezier. Produces a smooth SVG path through every point.
function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return ""
    const p = pts.map(pt=> [pt.x * 100, pt.y * 100])
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

const SKY_WORD_POSITIONS = [
    { x: 18, y: 24 },
    { x: 55, y: 18 },
    { x: 80, y: 31 },
    { x: 30, y: 45 },
    { x: 66, y: 50 },
    { x: 20, y: 67 },
    { x: 48, y: 74 },
    { x: 84, y: 70 },
    { x: 40, y: 29 },
    { x: 72, y: 82 },
]

function mountainWordStyle(mountainId: string, index: number): CSSProperties {
    const slot = SKY_WORD_POSITIONS[index % SKY_WORD_POSITIONS.length]
    const hash = Array.from(mountainId).reduce((sum, char, charIndex) => {
        return sum + char.charCodeAt(0) * (charIndex + 1)
    }, 0)
    const xOffset = ((hash % 17) - 8) * 0.45
    const yOffset = ((Math.floor(hash / 17) % 15) - 7) * 0.45
    const x = Math.min(88, Math.max(12, slot.x + xOffset))
    const y = Math.min(84, Math.max(14, slot.y + yOffset))

    return {
        ["--float-index"]: index,
        ["--word-x"]: `${x}%`,
        ["--word-y"]: `${y}%`,
        ["--float-distance"]: `${0.45 + (hash % 7) * 0.08}rem`,
        ["--float-drift"]: `${((Math.floor(hash / 7) % 9) - 4) * 0.12}rem`,
    } as CSSProperties
}

function MountainPage() {
    const { mountainId } = useParams()
    const { mountains, activeMountain, activeMountainId, selectMountain } = useMountain()
    const location = useLocation()
    const navigate = useNavigate()
    const navigationState = location.state as MountainLocationState | null
    const routeMountain = mountainId
        ? mountains.find((mountain) => mountain.id === mountainId) ?? null
        : activeMountain
    const route = routeMountain?.route ?? null
    const skill = route?.skill
    const routeMissing = Boolean(mountainId && !route)
    const error = routeMissing ? "That mountain is not saved in this browser anymore." : null
    const [revealing, setRevealing] = useState(false)
    const [loginStreak, setLoginStreak] = useState<LoginStreak>(() => readLoginStreak())
    const [journeyStats, setJourneyStats] = useState<JourneyStats>(() => readJourneyStats(routeStorageScope(skill ?? "default")))
    const [showEndgame, setShowEndgame] = useState(false)
    const [generatingNewPeak, setGeneratingNewPeak] = useState(false)
    const [newPeakStatus, setNewPeakStatus] = useState<string | null>(null)
    const [activeDetours, setActiveDetours] = useState<Detour[]>([])
    const [skyPickerOpen, setSkyPickerOpen] = useState(false)
    const [selectedSkyMountainId, setSelectedSkyMountainId] = useState<string | null>(null)
    const [skyPickerDescending, setSkyPickerDescending] = useState(false)
    const hadCompletedRouteRef = useRef(false)

    const { activeIndex, completedWaypoints, isCompleted, progressScope, setProgressScope } = useProgress()

    useEffect(() => {
        if (!mountainId) return
        selectMountain(mountainId)
    }, [mountainId, selectMountain])

    useEffect(() => {
        if (mountainId || !activeMountainId) return
        navigate(`/mountain/${activeMountainId}`, { replace: true })
    }, [activeMountainId, mountainId, navigate])

    useEffect(() => {
        if (!route || !navigationState?.reveal) return
        const timeout = window.setTimeout(() => setRevealing(true), 0)
        return () => window.clearTimeout(timeout)
    }, [navigationState?.reveal, route])

    useEffect(() => {
        if (!selectedSkyMountainId) return

        let closeTimeout: number | undefined
        const timeout = window.setTimeout(() => {
            setSkyPickerDescending(true)
            selectMountain(selectedSkyMountainId)
            navigate(`/mountain/${selectedSkyMountainId}`, { state: { reveal: true } })

            closeTimeout = window.setTimeout(() => {
                setSkyPickerOpen(false)
                setSelectedSkyMountainId(null)
                setSkyPickerDescending(false)
            }, SKY_DESCENT_OVERLAY_MS)
        }, SKY_SELECTION_HOLD_MS)

        return () => {
            window.clearTimeout(timeout)
            if (closeTimeout !== undefined) window.clearTimeout(closeTimeout)
        }
    }, [navigate, selectMountain, selectedSkyMountainId])

    useEffect(() => {
        window.localStorage.setItem(LOGIN_STREAK_STORAGE_KEY, JSON.stringify(loginStreak))
    }, [loginStreak])

    useEffect(() => {
        const refreshLoginStreak = () => setLoginStreak(readLoginStreak())
        window.addEventListener("focus", refreshLoginStreak)
        document.addEventListener("visibilitychange", refreshLoginStreak)

        return () => {
            window.removeEventListener("focus", refreshLoginStreak)
            document.removeEventListener("visibilitychange", refreshLoginStreak)
        }
    }, [])

    useEffect(() => {
        if (!route) return
        const nextScope = routeStorageScope(route.skill)
        hadCompletedRouteRef.current = false
        setShowEndgame(false)
        setGeneratingNewPeak(false)
        setNewPeakStatus(null)
        setProgressScope(nextScope)
        setActiveDetours(readActiveDetours(nextScope, route.route.map((waypoint) => waypoint.id)))
    }, [route, setProgressScope])

    useEffect(() => {
        if (!route) return
        if (progressScope !== routeStorageScope(route.skill)) return

        const scope = routeStorageScope(route.skill)
        const routeComplete = route.route.length > 0 && route.route.every((waypoint) => completedWaypoints.includes(waypoint.id))
        if (routeComplete && !hadCompletedRouteRef.current) {
            const alreadySeen = window.localStorage.getItem(endgameSeenKey(scope)) === "1"
            if (!alreadySeen) {
                setJourneyStats(readJourneyStats(scope))
                setShowEndgame(true)
                window.localStorage.setItem(endgameSeenKey(scope), "1")
            }
        }

        hadCompletedRouteRef.current = routeComplete
    }, [completedWaypoints, progressScope, route])

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
    }, [revealing])

    const peakPos = route ? pickPosition(route.route.length - 1, route.route.length) : { x: 0.5, y: 0.18 }
    const routeScope = route ? routeStorageScope(route.skill) : "default"
    const progressReady = !route || progressScope === routeScope
    const effectiveActiveIndex = progressReady ? activeIndex : 0
    const isWaypointCompleted = (waypointId: number) => progressReady && isCompleted(waypointId)

    function openSkyPicker() {
        if (revealing || showEndgame || mountains.length === 0) return
        setSelectedSkyMountainId(null)
        setSkyPickerDescending(false)
        setSkyPickerOpen(true)
    }

    function chooseMountain(nextMountainId: string) {
        if (selectedSkyMountainId) return
        if (!mountains.some((mountain) => mountain.id === nextMountainId)) return
        setSelectedSkyMountainId(nextMountainId)
    }

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
                activeIndex: effectiveActiveIndex,
            },
        })
    }

    function openDetour(detour: Detour) {
        if (!route) return
        const parentIndex = route.route.findIndex((waypoint) => waypoint.id === detour.parentWaypointId)
        const safeParentIndex = Math.max(0, parentIndex)
        const parentPos = pickPosition(safeParentIndex, route.route.length)
        const pos = {
            x: Math.min(0.88, Math.max(0.12, parentPos.x + (safeParentIndex % 2 === 0 ? 0.12 : -0.12))),
            y: Math.min(0.92, Math.max(0.08, parentPos.y + 0.035)),
        }

        navigate("/detail", {
            state: {
                detour,
                mode: "detour",
                parentWaypoint: route.route[safeParentIndex],
                index: safeParentIndex,
                total: route.route.length,
                skill: route.skill,
                focus: pos,
                fullRoute: route,
            },
        })
    }

    function climbNewPeak(nextSkill: string) {
        if (generatingNewPeak) return

        setGeneratingNewPeak(true)
        navigate("/", {
            state: { queuedSkill: nextSkill },
        })
    }

    if (!skill) {
        return (
            <div className="w-full h-screen bg-black/70 text-white flex flex-col items-center justify-center gap-5 px-6 text-center">
                <p className="text-xl">{error ?? "Choose a skill first."}</p>
                {mountains.length > 0 && (
                    <div className="flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-4">
                        {mountains.map((mountain) => (
                            <button
                                key={mountain.id}
                                type="button"
                                onClick={() => chooseMountain(mountain.id)}
                                className="mountain-sky-word mountain-sky-word-inline"
                            >
                                {mountain.route.skill}
                            </button>
                        ))}
                    </div>
                )}
                <Link to="/" className="rounded px-4 py-2 bg-white text-black font-bold">
                    Back
                </Link>
            </div>
        )
    }

    return (
        <div className={`relative w-full min-h-screen ${showEndgame ? "bg-black" : ""} ${skyPickerOpen ? "mountain-sky-picker-active" : ""}`}>
            <div
                className={
                    (revealing ? "mountain-reveal-stage absolute inset-0" :
                    showEndgame ? "endgame-mountain-stage absolute inset-0" :
                    "mountain-stage absolute inset-0") +
                    (skyPickerOpen ? " mountain-sky-stage-open" : "")
                }
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
            {!showEndgame && (
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
                    }}
                />
            )}

            {route && !showEndgame && (
                <div className="mountain-route-sign" aria-label={`Mt. Peak, ${route.skill}`}>
                    <p>Mt. Peak</p>
                    <h2>{route.skill}</h2>
                </div>
            )}

            {/* trail + waypoints layer */}
            {route && (() => {
                const positions = route.route.map((_, i) => pickPosition(i, route.route.length))
                const ghostPath = smoothPath(positions)
                const donePath = effectiveActiveIndex > 0 ? smoothPath(positions.slice(0, effectiveActiveIndex + 1)) : null
                const completedPositions = positions.slice(0, Math.min(effectiveActiveIndex + 1, positions.length))
                const detourPositions = activeDetours.map((detour) => {
                    const parentIndex = route.route.findIndex((waypoint) => waypoint.id === detour.parentWaypointId)
                    const safeParentIndex = Math.max(0, parentIndex)
                    const parentPos = positions[safeParentIndex] ?? positions[0]
                    return {
                        detour,
                        parentPos,
                        pos: {
                            x: Math.min(0.88, Math.max(0.12, parentPos.x + (safeParentIndex % 2 === 0 ? 0.12 : -0.12))),
                            y: Math.min(0.92, Math.max(0.08, parentPos.y + 0.035)),
                        },
                    }
                })
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
                                <linearGradient id="completed-trail-glow" x1="0%" y1="100%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(255, 112, 48, 0.95)" />
                                    <stop offset="46%" stopColor="rgba(255, 194, 92, 0.94)" />
                                    <stop offset="100%" stopColor="rgba(255, 244, 190, 0.92)" />
                                </linearGradient>
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
                                <>
                                    <path
                                        className="trail-glow trail-glow-reflection"
                                        d={donePath}
                                        mask="url(#trail-campfire-mask)"
                                        fill="none"
                                        stroke="rgba(255, 154, 64, 0.2)"
                                        strokeWidth="2.15"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        className="trail-glow trail-glow-wide"
                                        d={donePath}
                                        mask="url(#trail-campfire-mask)"
                                        fill="none"
                                        stroke="rgba(255, 178, 72, 0.38)"
                                        strokeWidth="1.35"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        className="trail-glow trail-glow-core"
                                        d={donePath}
                                        mask="url(#trail-campfire-mask)"
                                        fill="none"
                                        stroke="url(#completed-trail-glow)"
                                        strokeWidth="0.68"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {completedPositions.map((pos, i) => (
                                        <circle
                                            key={`trail-spark-${i}`}
                                            className="trail-spark"
                                            cx={pos.x * 100}
                                            cy={pos.y * 100}
                                            r={0.28}
                                            style={{ animationDelay: `${i * 0.22}s` }}
                                        />
                                    ))}
                                </>
                            )}
                            {detourPositions.map(({ detour, parentPos, pos }) => (
                                <path
                                    key={`detour-line-${detour.id}`}
                                    d={`M ${(parentPos.x * 100).toFixed(2)},${(parentPos.y * 100).toFixed(2)} Q ${(((parentPos.x + pos.x) / 2) * 100).toFixed(2)},${((Math.min(parentPos.y, pos.y) - 0.025) * 100).toFixed(2)} ${(pos.x * 100).toFixed(2)},${(pos.y * 100).toFixed(2)}`}
                                    fill="none"
                                    stroke="rgba(120, 210, 255, 0.56)"
                                    strokeWidth="0.42"
                                    strokeLinecap="round"
                                    strokeDasharray="1 1.6"
                                />
                            ))}
                        </svg>

                        {/* campfires — rendered above trail */}
                        {positions.map((pos, i) => {
                            const wp = route.route[i]
                            const state =
                                isWaypointCompleted(wp.id) || i < effectiveActiveIndex ? "completed" :
                                i === effectiveActiveIndex ? "active" : "far"
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
                        {detourPositions.map(({ detour, pos }) => (
                            <div
                                key={detour.id}
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
                            >
                                <Waypoint
                                    state="active"
                                    size={64}
                                    label="?"
                                    onClick={() => openDetour(detour)}
                                />
                                <span className="detour-label">Side trail</span>
                            </div>
                        ))}
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
            <header className={(revealing || showEndgame ? "mountain-reveal-chrome " : "") + "relative z-20 grid grid-cols-[1fr_auto_1fr] items-center px-8 py-5"}>
                <Link to="/" className="justify-self-start text-sm text-white/70 hover:text-white">
                    ← back
                </Link>
                {mountains.length > 0 && (
                    <button
                        type="button"
                        onClick={openSkyPicker}
                        disabled={revealing || showEndgame}
                        className="mountain-sky-trigger"
                        aria-expanded={skyPickerOpen}
                        aria-label="Choose a mountain from the sky"
                    >
                        <span className="mountain-sky-trigger-icon" aria-hidden="true">
                            <span className="mountain-sky-trigger-peak mountain-sky-trigger-peak-back" />
                            <span className="mountain-sky-trigger-peak mountain-sky-trigger-peak-front" />
                        </span>
                    </button>
                )}
                {route && (
                    <div
                        className="mountain-streak-fire justify-self-end"
                        aria-label={`${loginStreak.count} day login streak`}
                        title={`${loginStreak.count} day login streak`}
                    >
                        <span aria-hidden="true">🔥</span>
                        <strong>{loginStreak.count}</strong>
                    </div>
                )}
            </header>

            {skyPickerOpen && (
                <div
                    className={[
                        "mountain-sky-picker",
                        selectedSkyMountainId ? "mountain-sky-picker-selecting" : "",
                        skyPickerDescending ? "mountain-sky-picker-descending" : "",
                    ].filter(Boolean).join(" ")}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Choose a mountain"
                >
                    <button
                        type="button"
                        className="mountain-sky-picker-backdrop"
                        onClick={() => {
                            if (selectedSkyMountainId || skyPickerDescending) return
                            setSkyPickerOpen(false)
                        }}
                        aria-label="Return to the current mountain"
                    />
                    <div className="mountain-sky-picker-stars" aria-hidden="true">
                        <StarField mode={skyPickerDescending ? "descent" : "ascent"} />
                    </div>
                    <div className="mountain-sky-picker-list">
                        {mountains.map((mountain, index) => (
                            <button
                                key={mountain.id}
                                type="button"
                                onClick={() => chooseMountain(mountain.id)}
                                disabled={Boolean(selectedSkyMountainId)}
                                className={[
                                    "mountain-sky-word",
                                    mountain.id === routeMountain?.id ? "is-active" : "",
                                    mountain.id === selectedSkyMountainId ? "is-selected" : "",
                                    selectedSkyMountainId && mountain.id !== selectedSkyMountainId ? "is-hidden" : "",
                                ].filter(Boolean).join(" ")}
                                style={mountainWordStyle(mountain.id, index)}
                            >
                                {mountain.route.skill}
                            </button>
                        ))}
                    </div>
                </div>
            )}

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

            {showEndgame && (
                <div className="endgame-scene">
                    <div className="endgame-stars">
                        <StarField mode="ascent" />
                    </div>
                    <div className="endgame-copy">
                        <div className="endgame-congrats">
                            <span>Congrats on reaching the</span>
                            <span className="peak-title endgame-peak" aria-label="PEAK">
                                {"PEAK".split("").map((letter, i) => (
                                    <span
                                        key={letter}
                                        className="peak-title-letter"
                                        style={{ animationDelay: `${i * 0.12}s`, animationDuration: `${1.7 + i * 0.12}s` }}
                                    >
                                        {letter}
                                    </span>
                                ))}
                            </span>
                        </div>
                        <p className="endgame-journey-text">Let's look at your journey...</p>
                        <div className="endgame-stats" aria-label="Journey stats">
                            <div>
                                <span>Highest streak</span>
                                <strong>{loginStreak.highestCount} day{loginStreak.highestCount === 1 ? "" : "s"}</strong>
                            </div>
                            <div>
                                <span>Longest task time</span>
                                <strong>{formatDuration(journeyStats.longestTaskMs)}</strong>
                            </div>
                            <div>
                                <span>Shortest task time</span>
                                <strong>{formatDuration(journeyStats.shortestTaskMs)}</strong>
                            </div>
                            <div>
                                <span>Total attempts</span>
                                <strong>{journeyStats.totalAttempts}</strong>
                            </div>
                        </div>
                        <div className="endgame-new-peak">
                            <p>Climb a new peak</p>
                            <SkillInput disabled={generatingNewPeak} onSubmit={climbNewPeak} />
                            {newPeakStatus && (
                                <span>{newPeakStatus}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MountainPage
