export type WaypointState = "far" | "active" | "completed"

type WaypointProps = {
  state?: WaypointState
  size?: number
  label?: string
  onClick?: () => void
}

const STATE = {
  far: {
    opacity: 0.32,
    scale: 0.82,
    glow: "rgba(255, 170, 70, 0.12)",
    glowSpread: "55%",
    flicker: false,
    label: "text-white/40",
  },
  active: {
    opacity: 1,
    scale: 1,
    glow: "rgba(255, 150, 60, 0.55)",
    glowSpread: "65%",
    flicker: true,
    label: "text-white",
  },
  completed: {
    opacity: 1,
    scale: 1.08,
    glow: "rgba(255, 215, 130, 0.85)",
    glowSpread: "70%",
    flicker: true,
    label: "text-amber-200",
  },
} as const

export default function Waypoint({
  state = "active",
  size = 140,
  label,
  onClick,
}: WaypointProps) {
  const s = STATE[state]
  const flameClass = s.flicker ? "campfire-flames campfire-flames-anim" : "campfire-flames"

  return (
    <button
      type="button"
      onClick={onClick}
      className="campfire group"
      style={{ width: size, height: size, opacity: s.opacity, transform: `scale(${s.scale})` }}
    >
      <span
        className={`campfire-glow ${s.flicker ? "campfire-glow-anim" : ""}`}
        style={{
          background: `radial-gradient(circle, ${s.glow} 0%, transparent ${s.glowSpread})`,
        }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 100 100" className="relative w-full h-full">
        <defs>
          <radialGradient id={`flame-outer-${state}`} cx="0.5" cy="0.95" r="0.75">
            <stop offset="0%" stopColor="#ffb352" />
            <stop offset="55%" stopColor="#ff5a1a" />
            <stop offset="100%" stopColor="#a01506" />
          </radialGradient>
          <radialGradient id={`flame-mid-${state}`} cx="0.5" cy="0.95" r="0.7">
            <stop offset="0%" stopColor="#fff1a8" />
            <stop offset="60%" stopColor="#ffae3a" />
            <stop offset="100%" stopColor="#ff7517" />
          </radialGradient>
          <radialGradient id={`flame-core-${state}`} cx="0.5" cy="0.95" r="0.6">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fff5b8" />
            <stop offset="100%" stopColor="#ffd14a" />
          </radialGradient>
          <linearGradient id="log-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a4a2a" />
            <stop offset="100%" stopColor="#3a2210" />
          </linearGradient>
        </defs>

        {/* ground shadow */}
        <ellipse cx="50" cy="86" rx="26" ry="3" fill="rgba(0,0,0,0.45)" />

        {/* logs (crossed) */}
        <g>
          <rect
            x="18"
            y="74"
            width="64"
            height="9"
            rx="3.5"
            fill="url(#log-grad)"
            transform="rotate(-14 50 78)"
          />
          <rect
            x="22"
            y="75.5"
            width="56"
            height="2"
            rx="1"
            fill="#a06a3a"
            opacity="0.55"
            transform="rotate(-14 50 78)"
          />
          <rect
            x="18"
            y="74"
            width="64"
            height="9"
            rx="3.5"
            fill="url(#log-grad)"
            transform="rotate(16 50 78)"
          />
          <rect
            x="22"
            y="75.5"
            width="56"
            height="2"
            rx="1"
            fill="#a06a3a"
            opacity="0.55"
            transform="rotate(16 50 78)"
          />
        </g>

        {/* embers (only active/completed) */}
        {state !== "far" && (
          <g className="campfire-embers">
            <circle cx="42" cy="80" r="1.1" fill="#ff8a3c" />
            <circle cx="58" cy="79" r="0.9" fill="#ffb260" />
            <circle cx="50" cy="82" r="1.3" fill="#ffd06a" />
          </g>
        )}

        {/* flames */}
        <g className={flameClass}>
          <path
            className="flame flame-outer"
            d="M50 72 Q34 56 38 34 Q43 18 50 8 Q57 18 62 34 Q66 56 50 72 Z"
            fill={`url(#flame-outer-${state})`}
          />
          <path
            className="flame flame-mid"
            d="M50 70 Q40 58 43 40 Q47 26 50 18 Q53 26 57 40 Q60 58 50 70 Z"
            fill={`url(#flame-mid-${state})`}
          />
          <path
            className="flame flame-core"
            d="M50 66 Q45 58 47 46 Q49 36 50 30 Q51 36 53 46 Q55 58 50 66 Z"
            fill={`url(#flame-core-${state})`}
          />
        </g>
      </svg>

      {label && (
        <span className={`campfire-label ${s.label}`}>{label}</span>
      )}
    </button>
  )
}
