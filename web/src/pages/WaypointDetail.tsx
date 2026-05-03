import { useLocation, useNavigate } from "react-router-dom"
import { useRef, useState, type ChangeEvent } from "react"
import Waypoint from "../components/Waypoint"
import type { Waypoint as WaypointData, Route, Feedback } from "../../../shared/schema"
import mountainImg from "../assets/mountain2.png"
import { pickPosition } from "../lib/pathMath"
import { evaluateSubmission } from "../api"
import { useProgress } from "../lib/ProgressContext"

type JourneyStats = {
  totalAttempts: number
  longestTaskMs: number
  shortestTaskMs: number | null
}

type DetailLocationState = {
  waypoint?: WaypointData
  index?: number
  total?: number
  skill?: string
  focus?: { x: number; y: number }
  fullRoute?: Route
}

const FALLBACK = {
  id: 1,
  title: "Light the first fire",
  summary:
    "Every climb starts at base camp. Set up your server folder and download the official server.jar — no terminal yet, just get the file in the right place.",
  challenge: {
    type: "text" as const,
    prompt: "Tell the guide where you saved server.jar and what folder you made for it.",
  },
  difficulty: 1 as 1 | 2 | 3 | 4 | 5,
  x: 0,
  y: 0,
}

const STATUS_META = {
  not_completed: { label: "Not started", dot: "bg-white/40", text: "text-white/60" },
  in_progress:   { label: "In progress", dot: "bg-amber-300", text: "text-amber-200" },
  completed:     { label: "Completed",   dot: "bg-emerald-300", text: "text-emerald-200" },
}

const JOURNEY_STATS_STORAGE_KEY_PREFIX = "peak_journey_stats"

function journeyStatsKey(scope: string): string {
  return `${JOURNEY_STATS_STORAGE_KEY_PREFIX}_${scope}`
}

function readJourneyStats(scope: string): JourneyStats {
  try {
    const saved = localStorage.getItem(journeyStatsKey(scope))
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

function recordJourneyAttempt(scope: string, taskStartedAt: number | null) {
  const elapsedMs = taskStartedAt === null ? 0 : Math.max(0, Date.now() - taskStartedAt)
  const current = readJourneyStats(scope)
  const next: JourneyStats = {
    totalAttempts: current.totalAttempts + 1,
    longestTaskMs: Math.max(current.longestTaskMs, elapsedMs),
    shortestTaskMs: current.shortestTaskMs === null ? elapsedMs : Math.min(current.shortestTaskMs, elapsedMs),
  }

  localStorage.setItem(journeyStatsKey(scope), JSON.stringify(next))
}

function routeStorageScope(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "default"
}

function waypointStorageKey(kind: "submission" | "feedback", skill: string, waypointId: number) {
  return `peak_${kind}_${routeStorageScope(skill)}_${waypointId}`
}

function WaypointDetail() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as DetailLocationState | null
  const wp = state?.waypoint ?? FALLBACK
  const index = state?.index ?? 0
  const total = state?.total ?? 8
  const skill = state?.skill ?? "default"
  const focus = state?.focus ?? { x: 0.5, y: 0.5 }
  const fullRoute = state?.fullRoute
  
  const { markCompleted, isCompleted, activeIndex } = useProgress()
  const alreadyCompleted = isCompleted(wp.id)

  const [submission, setSubmission] = useState(() => {
    return localStorage.getItem(waypointStorageKey("submission", skill, wp.id)) || ""
  })
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(() => {
    const saved = localStorage.getItem(waypointStorageKey("feedback", skill, wp.id))
    return saved ? JSON.parse(saved) : null
  })
  const [error, setError] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(alreadyCompleted)
  const [isExiting, setIsExiting] = useState(false)
  const taskStartedAtRef = useRef<number | null>(null)

  const isLocked = index > activeIndex
  const statusKey = alreadyCompleted || feedback?.passed ? "completed" : feedback ? "in_progress" : "not_completed"
  const status = STATUS_META[statusKey]

  const challengeType = wp.challenge.type
  const isFileChallenge = challengeType === "photo" || challengeType === "code" || challengeType === "pdf"

  const FILE_META: Record<"photo" | "code" | "pdf", { label: string; cta: string; accept: string; hint: string }> = {
    photo: {
      label: "Upload a photo",
      cta: "Choose a photo",
      // Claude vision only accepts these MIME types — HEIC etc. would fail.
      accept: "image/jpeg,image/png,image/webp,image/gif",
      hint: "JPG, PNG, WebP, or GIF — a clear shot of your work.",
    },
    code: {
      label: "Upload your code",
      cta: "Choose a code file",
      accept: ".js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.cs,.rb,.go,.rs,.html,.css,.json,.md,.txt,.zip",
      hint: "A single source file or a .zip of your project.",
    },
    pdf: {
      label: "Upload a PDF",
      cta: "Choose a PDF",
      accept: "application/pdf,.pdf",
      hint: "Export your work as a PDF and attach it here.",
    },
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    taskStartedAtRef.current ??= Date.now()
    const f = e.target.files?.[0] ?? null
    setFile(f)
  }

  // Re-encode any image as a downscaled JPEG (max 1600px on the long edge,
  // ~quality 0.85) so it stays well under Claude's 5MB image limit and is in
  // a supported MIME. Returns { base64, mime }.
  async function imageToJpeg(f: File): Promise<{ base64: string; mime: "image/jpeg" }> {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(f)
    })
    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error("could not decode image — try a JPG or PNG"))
      i.src = dataUrl
    })

    const MAX = 1600
    const scale = Math.min(1, MAX / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("canvas not available")
    ctx.drawImage(img, 0, 0, w, h)

    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.85)
    const base64 = jpegDataUrl.split(",")[1]
    return { base64, mime: "image/jpeg" }
  }

  async function handleSubmit() {
    if (submitting || alreadyCompleted || isLocked) return
    if (isFileChallenge ? !file : !submission.trim()) return

    setSubmitting(true)
    setError(null)
    recordJourneyAttempt(routeStorageScope(skill), taskStartedAtRef.current)

    try {
      let imageBase64: string | undefined
      let imageMime: string | undefined
      let text: string | undefined = submission || undefined
      if (challengeType === "photo" && file) {
        const re = await imageToJpeg(file)
        imageBase64 = re.base64
        imageMime = re.mime
      } else if ((challengeType === "code" || challengeType === "pdf") && file) {
        const fileText = await file.text()
        const trimmed = fileText.length > 60_000 ? fileText.slice(0, 60_000) + "\n\n…[truncated]" : fileText
        text = `Uploaded file: ${file.name}\n\n${trimmed}`
      }

      const result = await evaluateSubmission(wp, {
        text,
        imageBase64,
        imageMime,
      })

      setFeedback(result)
      localStorage.setItem(waypointStorageKey("feedback", skill, wp.id), JSON.stringify(result))
      localStorage.setItem(waypointStorageKey("submission", skill, wp.id), submission)
      
      if (result.passed) {
        markCompleted(wp.id)
      }
    } catch (err) {
      console.error("[detail] submission failed", err)
      setError(err instanceof Error ? err.message : "submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  function goBack() {
    if (isExiting) return
    setIsExiting(true)
    setTimeout(() => {
      if (window.history.length > 1) navigate(-1)
      else navigate("/")
    }, 1200)
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* zooming stage — mountain + campfire grow together as one motion */}
      <div
        className={`pointer-events-none absolute inset-0 detail-zoom-stage ${isExiting ? 'exiting' : ''}`}
        style={{
          transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
          "--focus-x": focus.x,
          "--focus-y": focus.y,
        } as React.CSSProperties}
      >
        <img
          src={mountainImg}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* all waypoints, anchored at their focus points so they zoom with the mountain */}
        {fullRoute && (
          <div className="absolute inset-0">
            {fullRoute.route.map((waypoint, i) => {
              const pos = pickPosition(i, fullRoute.route.length)
              const isFocused = i === index
              
              const completed = isCompleted(waypoint.id)
              const isActive = i === activeIndex
              const state =
                completed ? "completed" :
                isActive ? "active" : "far"
                
              return (
                <div
                  key={waypoint.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                    !isFocused ? (isExiting ? 'detail-waypoint-fade-in' : 'detail-waypoint-fade-out') : ''
                  }`}
                  style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
                >
                  <Waypoint
                    state={state}
                    size={state === "active" ? 110 : 80}
                  />
                </div>
              )
            })}
          </div>
        )}
        {!fullRoute && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }}
          >
            <Waypoint state="active" size={110} />
          </div>
        )}
      </div>
      {/* initial vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* darken */}
      <div
        className={`pointer-events-none absolute inset-0 detail-darken ${isExiting ? 'exiting' : ''}`}
        style={{
          background:
            "radial-gradient(ellipse at 35% 28%, rgba(69,38,18,0.24) 0%, rgba(34,19,10,0.68) 62%, rgba(12,8,5,0.88) 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 waypoint-woodgrain" />

      {/* top bar */}
      <header className={`relative z-20 flex items-center justify-between px-10 py-6 detail-content-in ${isExiting ? 'exiting' : ''}`}>
        <button
          type="button"
          onClick={goBack}
          className="waypoint-link"
        >
          <span className="text-base">←</span> back to mountain
        </button>
        <div className="waypoint-kicker">
          <span>Waypoint {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        </div>
      </header>

      {/* main split */}
      <main className={`relative z-10 mx-auto flex max-w-7xl items-start gap-12 px-10 pb-16 detail-content-in waypoint-detail-layout ${isExiting ? 'exiting' : ''}`}>
        {/* LEFT — title + meta */}
        <section className="flex flex-1 flex-col gap-6 pt-12">
          <div className="waypoint-kicker">
            <span className="waypoint-kicker-rule" />
            {index === 0 ? "Base camp" : index === total - 1 ? "The Summit" : "Climbing on"}
          </div>
          <h1 className="waypoint-title">{wp.title}</h1>
          <div className="flex items-center gap-4 text-sm text-stone-200/72">
            <span className="inline-flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-4 rounded-full ${
                    i < wp.difficulty ? "bg-amber-300" : "bg-white/15"
                  }`}
                />
              ))}
              <span className="ml-2">difficulty</span>
            </span>
            <span className="h-3 w-px bg-white/20" />
            <span>{challengeType} challenge</span>
          </div>
          
          {alreadyCompleted && (
            <div className="mt-4">
              <button
                onClick={() => setShowReview(true)}
                className="waypoint-chip"
              >
                View your submission
              </button>
            </div>
          )}
        </section>

        {/* RIGHT — content */}
        <section className="relative flex-1 pt-12">
          <div className="waypoint-scroll-panel">
            {/* status */}
            <div className="mb-6 flex items-center justify-between">
              <span className="waypoint-kicker">
                Challenge
              </span>
              <span className={`inline-flex items-center gap-2 text-xs ${status.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>

            {/* summary */}
            <p className="text-[1.05rem] leading-relaxed text-stone-50/88">{wp.summary}</p>

            {/* prompt */}
            <div className="waypoint-task-block">
              <h3 className="waypoint-kicker mb-2">
                Your task
              </h3>
              <p className="text-sm leading-relaxed text-stone-50/92">{wp.challenge.prompt}</p>
            </div>

            {/* divider */}
            <div className="waypoint-divider" />

            {isLocked && (
              <div className="waypoint-locked">
                <div className="waypoint-kicker mb-1">
                  Locked
                </div>
                Finish the waypoints before this one to unlock the challenge.
              </div>
            )}

            {/* submission */}
            <div className={isLocked ? "pointer-events-none opacity-50" : ""}>
              <h3 className="text-[0.7rem] uppercase tracking-[0.3em] text-white/40 mb-3">
                {isFileChallenge ? FILE_META[challengeType as "photo" | "code" | "pdf"].label : "Your answer"}
              </h3>
              {isFileChallenge ? (
                <FileDrop
                  meta={FILE_META[challengeType as "photo" | "code" | "pdf"]}
                  file={file}
                  onChange={handleFile}
                  onClear={() => setFile(null)}
                  disabled={submitting || alreadyCompleted}
                />
              ) : (
                <textarea
                  value={submission}
                  onChange={(e) => {
                    taskStartedAtRef.current ??= Date.now()
                    setSubmission(e.target.value)
                  }}
                  placeholder="Tell the guide what you did..."
                  rows={4}
                  disabled={submitting || alreadyCompleted}
                  className="waypoint-answer"
                />
              )}
            </div>

            {/* error display */}
            {error && (
              <div className="mt-4 rounded-md bg-red-950/40 border border-red-300/20 px-4 py-2 text-xs text-red-200">
                {error}
              </div>
            )}

            {feedback && (
              <div className={`mt-4 rounded-md border px-4 py-3 text-sm ${
                feedback.passed
                  ? "border-emerald-300/20 bg-emerald-950/30 text-emerald-100"
                  : "border-amber-300/20 bg-amber-950/30 text-amber-100"
              }`}>
                {feedback.feedback}
              </div>
            )}

            {/* big submit */}
            {!alreadyCompleted && !isLocked && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={(isFileChallenge ? !file : !submission.trim()) || submitting}
                className="waypoint-action"
              >
                <span className="relative z-10">
                  {submitting ? "Sending to the guide..." : "Submit & climb on"}
                </span>
              </button>
            )}

            {/* success state CTA */}
            {alreadyCompleted && (
              <button
                type="button"
                onClick={goBack}
                className="waypoint-action waypoint-action-complete"
              >
                <span className="relative z-10">Return to Mountain</span>
              </button>
            )}
          </div>
        </section>
      </main>

      {showReview && !feedback && null}
    </div>
  )
}

type FileDropProps = {
  meta: { label: string; cta: string; accept: string; hint: string }
  file: File | null
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  disabled?: boolean
}

function FileDrop({ meta, file, onChange, onClear, disabled }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={`waypoint-file-drop ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        ref={inputRef}
        type="file"
        accept={meta.accept}
        onChange={onChange}
        className="hidden"
        disabled={disabled}
      />
      {file ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-stone-50">{file.name}</p>
            <p className="text-xs text-stone-200/50">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <div className="flex shrink-0 gap-2">
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="waypoint-small-button"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="waypoint-small-button waypoint-small-button-muted"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => !disabled && inputRef.current?.click()}
            disabled={disabled}
            className="waypoint-small-button"
          >
            {meta.cta}
          </button>
          <p className="text-xs text-stone-200/52">{meta.hint}</p>
        </div>
      )}
    </div>
  )
}

export default WaypointDetail
