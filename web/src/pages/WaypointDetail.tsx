import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"
import Waypoint from "../components/Waypoint"
import type { Waypoint as WaypointData } from "../../../shared/schema"

type DetailLocationState = {
  waypoint?: WaypointData
  index?: number
  total?: number
  skill?: string
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
  const status = STATUS_META["not_completed"]

  const [submission, setSubmission] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit() {
    if (!submission.trim() || submitting) return
    setSubmitting(true)
    setTimeout(() => setSubmitting(false), 1200)
  }

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate("/")
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden text-white bg-[#0a0a0f]">
      {/* atmospheric backdrop — placeholder for the mountain */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 60%, rgba(120, 60, 30, 0.45) 0%, rgba(0,0,0,0) 55%), radial-gradient(ellipse at 80% 30%, rgba(40, 60, 110, 0.35) 0%, rgba(0,0,0,0) 60%), linear-gradient(to bottom, #07070d 0%, #0c0a14 60%, #050308 100%)",
        }}
      />
      {/* faint silhouette */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55vh]"
        style={{
          background:
            "linear-gradient(135deg, transparent 0 32%, #1a1d2a 32% 46%, transparent 46%), linear-gradient(45deg, transparent 0 38%, #232735 38% 54%, transparent 54%), linear-gradient(to top, #0a0a14 0%, rgba(10,10,20,0) 100%)",
          opacity: 0.7,
        }}
      />

      {/* top bar */}
      <header className="relative z-20 flex items-center justify-between px-10 py-6">
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
      <main className="relative z-10 mx-auto flex max-w-7xl items-center gap-12 px-10 pb-16">
        {/* LEFT — campfire + title */}
        <section className="flex flex-1 flex-col items-center gap-8 pt-8">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-amber-200/70">
            <span className="h-px w-8 bg-amber-200/40" />
            Base camp
            <span className="h-px w-8 bg-amber-200/40" />
          </div>

          <div className="relative">
            <Waypoint state="active" size={260} />
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">{wp.title}</h1>
            <div className="mt-3 flex items-center justify-center gap-4 text-sm text-white/50">
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
              <span>{wp.challenge.type === "photo" ? "photo" : "text"} challenge</span>
            </div>
          </div>
        </section>

        {/* RIGHT — glass panel */}
        <section className="relative flex-1">
          <div
            className="relative rounded-2xl border border-white/10 p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            {/* subtle highlight on the top edge */}
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

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
                Your answer
              </h3>
              <textarea
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                placeholder="Tell the guide what you did..."
                rows={4}
                className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-200/20 transition-colors"
              />
            </div>

            {/* big submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!submission.trim() || submitting}
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

export default WaypointDetail
