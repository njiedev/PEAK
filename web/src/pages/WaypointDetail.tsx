import { useLocation, useNavigate } from "react-router-dom"
import { useRef, useState, type ChangeEvent } from "react"
import Waypoint from "../components/Waypoint"
import type { Waypoint as WaypointData } from "../../../shared/schema"
import mountainImg from "../assets/mountain.png"

type DetailLocationState = {
  waypoint?: WaypointData
  index?: number
  total?: number
  skill?: string
  focus?: { x: number; y: number }
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
  const status = STATUS_META["not_completed"]

  const [submission, setSubmission] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const challengeType = wp.challenge.type
  const isFileChallenge = challengeType === "photo" || challengeType === "code" || challengeType === "pdf"

  const FILE_META: Record<"photo" | "code" | "pdf", { label: string; cta: string; accept: string; hint: string }> = {
    photo: {
      label: "Upload a photo",
      cta: "Choose a photo",
      accept: "image/*",
      hint: "PNG, JPG, or HEIC — a clear shot of your work.",
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

  function handleSubmit() {
    if (submitting) return
    if (isFileChallenge ? !file : !submission.trim()) return
    setSubmitting(true)
    setTimeout(() => setSubmitting(false), 1200)
  }

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate("/")
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden text-white bg-[#0a0a0f]">
      {/* zooming stage — mountain + campfire grow together as one motion */}
      <div
        className="pointer-events-none absolute inset-0 detail-zoom-stage"
        style={{ transformOrigin: `${focus.x * 100}% ${focus.y * 100}%` }}
      >
        <img
          src={mountainImg}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* the campfire, anchored at the focus point so it zooms with the mountain */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }}
        >
          <Waypoint state="active" size={110} />
        </div>
      </div>

      {/* darken once we've arrived, so text reads */}
      <div
        className="pointer-events-none absolute inset-0 detail-darken"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 70%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* top bar */}
      <header className="relative z-20 flex items-center justify-between px-10 py-6 detail-content-in">
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
      <main className="relative z-10 mx-auto flex max-w-7xl items-start gap-12 px-10 pb-16 detail-content-in">
        {/* LEFT — title + meta (campfire is the zoomed background element) */}
        <section className="flex flex-1 flex-col gap-6 pt-12">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-amber-200/70">
            <span className="h-px w-8 bg-amber-200/40" />
            Base camp
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
        </section>

        {/* RIGHT — content blends into the mountain */}
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

            {/* submission */}
            <div>
              <h3 className="text-[0.7rem] uppercase tracking-[0.3em] text-white/40 mb-3">
                {isFileChallenge ? FILE_META[challengeType as "photo" | "code" | "pdf"].label : "Your answer"}
              </h3>
              {isFileChallenge ? (
                <FileDrop
                  meta={FILE_META[challengeType as "photo" | "code" | "pdf"]}
                  file={file}
                  onChange={handleFile}
                  onClear={() => setFile(null)}
                />
              ) : (
                <textarea
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                  placeholder="Tell the guide what you did..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-200/20 transition-colors"
                />
              )}
            </div>

            {/* big submit */}
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
          </div>
        </section>
      </main>
    </div>
  )
}

type FileDropProps = {
  meta: { label: string; cta: string; accept: string; hint: string }
  file: File | null
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}

function FileDrop({ meta, file, onChange, onClear }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-black/30 px-4 py-5">
      <input
        ref={inputRef}
        type="file"
        accept={meta.accept}
        onChange={onChange}
        className="hidden"
      />
      {file ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-white">{file.name}</p>
            <p className="text-xs text-white/40">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <div className="flex shrink-0 gap-2">
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
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100 hover:border-amber-300/60 hover:bg-amber-300/15"
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
