import { useLocation, useNavigate } from "react-router-dom"
import { useRef, useState, type ChangeEvent, useEffect } from "react"
import Waypoint from "../components/Waypoint"
import type { Waypoint as WaypointData, Route, Feedback } from "../../../shared/schema"
import mountainImg from "../assets/mountain2.png"
import { pickPosition } from "../lib/pathMath"
import { evaluateSubmission } from "../api"
import { useProgress } from "../lib/ProgressContext"

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

function WaypointDetail() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as DetailLocationState | null
  const wp = state?.waypoint ?? FALLBACK
  const index = state?.index ?? 0
  const total = state?.total ?? 8
  const focus = state?.focus ?? { x: 0.5, y: 0.5 }
  const fullRoute = state?.fullRoute
  
  const { markCompleted, isCompleted, activeIndex } = useProgress()
  const alreadyCompleted = isCompleted(wp.id)

  const [submission, setSubmission] = useState(() => {
    return localStorage.getItem(`peak_submission_${wp.id}`) || ""
  })
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(() => {
    const saved = localStorage.getItem(`peak_feedback_${wp.id}`)
    return saved ? JSON.parse(saved) : null
  })
  const [error, setError] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(alreadyCompleted)
  const [isExiting, setIsExiting] = useState(false)

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
    const f = e.target.files?.[0] ?? null
    setFile(f)
  }

  async function fileToBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(f)
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1]
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
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

    try {
      let imageBase64: string | undefined
      let imageMime: string | undefined
      if (challengeType === "photo" && file) {
        const re = await imageToJpeg(file)
        imageBase64 = re.base64
        imageMime = re.mime
      }

      const result = await evaluateSubmission(wp, {
        text: submission || undefined,
        imageBase64,
        imageMime,
      })

      setFeedback(result)
      localStorage.setItem(`peak_feedback_${wp.id}`, JSON.stringify(result))
      localStorage.setItem(`peak_submission_${wp.id}`, submission)
      
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
                  className={`absolute -translate-x-1/2 -translate-y-1/2 ${!isFocused ? 'detail-waypoint-fade-out' : ''}`}
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
            "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 70%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* top bar */}
      <header className={`relative z-20 flex items-center justify-between px-10 py-6 detail-content-in ${isExiting ? 'exiting' : ''}`}>
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <span className="text-base">←</span> back to mountain
        </button>
        <div className="flex items-center gap-2 text-xs text-white/40 tracking-widest uppercase">
          <span>Waypoint {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        </div>
      </header>

      {/* main split */}
      <main className={`relative z-10 mx-auto flex max-w-7xl items-start gap-12 px-10 pb-16 detail-content-in ${isExiting ? 'exiting' : ''}`}>
        {/* LEFT — title + meta */}
        <section className="flex flex-1 flex-col gap-6 pt-12">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-amber-200/70">
            <span className="h-px w-8 bg-amber-200/40" />
            {index === 0 ? "Base camp" : index === total - 1 ? "The Summit" : "Climbing on"}
          </div>
          <h1 className="text-5xl font-bold tracking-tight">{wp.title}</h1>
          <div className="flex items-center gap-4 text-sm text-white/60">
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
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                <span>👁</span> View your submission
              </button>
            </div>
          )}
        </section>

        {/* RIGHT — content */}
        <section className="relative flex-1 pt-12">
          <div className="relative">
            {/* status */}
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[0.7rem] uppercase tracking-[0.3em] text-white/40">
                Challenge
              </span>
              <span className={`inline-flex items-center gap-2 text-xs ${status.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>

            {/* summary */}
            <p className="text-[1.05rem] leading-relaxed text-white/85">{wp.summary}</p>

            {/* prompt */}
            <div className="mt-6 rounded-lg border border-amber-200/20 bg-amber-200/[0.04] p-4">
              <h3 className="text-[0.7rem] uppercase tracking-[0.3em] text-amber-200/70 mb-2">
                Your task
              </h3>
              <p className="text-sm leading-relaxed text-white/90">{wp.challenge.prompt}</p>
            </div>

            {/* divider */}
            <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {isLocked && (
              <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/70">
                <div className="mb-1 flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-white/40">
                  <span>🔒</span> Locked
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
                  onChange={(e) => setSubmission(e.target.value)}
                  placeholder="Tell the guide what you did..."
                  rows={4}
                  disabled={submitting || alreadyCompleted}
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-200/20 transition-colors disabled:opacity-50"
                />
              )}
            </div>

            {/* error display */}
            {error && (
              <div className="mt-4 rounded-md bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* big submit */}
            {!alreadyCompleted && !isLocked && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={(isFileChallenge ? !file : !submission.trim()) || submitting}
                className="group relative mt-5 w-full overflow-hidden rounded-xl border border-amber-300/30 px-6 py-4 text-base font-semibold tracking-wide text-amber-50 transition-all hover:border-amber-300/60 hover:shadow-[0_0_40px_-5px_rgba(255,180,80,0.5)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,150,60,0.25) 0%, rgba(255,80,30,0.15) 100%)",
                }}
              >
                <span className="relative z-10">
                  {submitting ? "Sending to the guide..." : "Submit & climb on"}
                </span>
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(255,200,120,0.25) 0%, transparent 70%)",
                  }}
                />
              </button>
            )}

            {/* success state CTA */}
            {alreadyCompleted && (
              <button
                type="button"
                onClick={goBack}
                className="group relative mt-5 w-full overflow-hidden rounded-xl border border-emerald-300/30 px-6 py-4 text-base font-semibold tracking-wide text-emerald-50 transition-all hover:border-emerald-300/60 hover:shadow-[0_0_40px_-5px_rgba(50,255,150,0.3)]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(50,200,100,0.25) 0%, rgba(20,150,80,0.15) 100%)",
                }}
              >
                <span className="relative z-10">Return to Mountain</span>
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(100,255,180,0.2) 0%, transparent 70%)",
                  }}
                />
              </button>
            )}
          </div>
        </section>
      </main>

      {/* feedback popup overlay */}
      {(feedback || showReview) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-[#12121a] shadow-2xl animate-in zoom-in-95 duration-300">
            {/* decoration header */}
            <div className={`h-2 w-full ${(feedback?.passed ?? alreadyCompleted) ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            
            <div className="p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${(feedback?.passed ?? alreadyCompleted) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {(feedback?.passed ?? alreadyCompleted) ? (
                    <span className="text-xl font-bold">✓</span>
                  ) : (
                    <span className="text-xl font-bold">!</span>
                  )}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {(feedback?.passed ?? alreadyCompleted) ? "Great job!" : "Almost there!"}
                </h2>
              </div>
              
              <p className="mb-8 text-lg leading-relaxed text-white/80 italic">
                "{feedback?.feedback || "You've completed this challenge successfully!"}"
              </p>
              
              <button
                type="button"
                onClick={() => { setFeedback(null); setShowReview(false); }}
                className="w-full rounded-xl bg-white/10 px-6 py-4 text-sm font-bold uppercase tracking-widest text-white hover:bg-white/20 transition-colors"
              >
                {(feedback?.passed ?? alreadyCompleted) ? "Continue climbing" : "I'll try again"}
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className={`rounded-lg border border-dashed border-white/15 bg-black/30 px-4 py-5 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
            <p className="truncate text-sm text-white">{file.name}</p>
            <p className="text-xs text-white/40">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <div className="flex shrink-0 gap-2">
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:border-white/40 hover:text-white"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white"
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
            className="inline-flex items-center gap-2 rounded-md border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100 hover:border-amber-300/60 hover:bg-amber-300/15 disabled:cursor-not-allowed"
          >
            <span aria-hidden>＋</span> {meta.cta}
          </button>
          <p className="text-xs text-white/40">{meta.hint}</p>
        </div>
      )}
    </div>
  )
}

export default WaypointDetail
