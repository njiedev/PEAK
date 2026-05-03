import { Link } from "react-router-dom"
import Waypoint from "../components/Waypoint"

function WaypointLab() {
  return (
    <div className="relative w-full min-h-screen bg-neutral-950 text-white overflow-hidden">
      {/* warm vignette so the campfires read against the dark */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(80,40,20,0.35) 0%, rgba(0,0,0,0) 60%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <h1 className="text-2xl font-bold tracking-wide">Waypoint Lab</h1>
        <Link
          to="/"
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          ← back
        </Link>
      </header>

      <main className="relative z-10 flex flex-col items-center gap-16 pt-12 pb-32">
        <p className="max-w-md text-center text-white/55 text-sm">
          Three campfires for tweaking. Hot-reload kicks in on save.
        </p>

        <div className="flex flex-wrap items-end justify-center gap-20">
          <div className="flex flex-col items-center gap-10">
            <Waypoint state="far" label="far" />
          </div>
          <div className="flex flex-col items-center gap-10">
            <Waypoint state="active" label="active" />
          </div>
          <div className="flex flex-col items-center gap-10">
            <Waypoint state="completed" label="completed" />
          </div>
        </div>
      </main>
    </div>
  )
}

export default WaypointLab
