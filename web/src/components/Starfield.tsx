import { useEffect, useState } from "react"

type StarFieldMode = "idle" | "descent"
type StarData = {
  x: number
  y: number
  delay: number
  size: number
  opacity: number
}

function Star({
  x,
  y,
  delay,
  size,
  opacity,
  mode,
}: {
  x: number
  y: number
  delay: number
  size: number
  opacity: number
  mode: StarFieldMode
}) {
  const displaySize = mode === "descent" ? size + 2 : size
  const shadow = mode === "descent" ? "0 0 8px rgba(255, 255, 255, 0.9)" : undefined
  const animation = mode === "descent" ? undefined : `blink 2s ${delay}s infinite`

  return (
    <div
      className="absolute bg-white"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${displaySize}px`,
        height: `${displaySize}px`,
        opacity,
        boxShadow: shadow,
        animation,
      }}
    />
  )
}

export default function StarField({ mode = "idle" }: { mode?: StarFieldMode }) {
  const [stars, setStars] = useState<StarData[]>([])

  useEffect(() => {
    const generated = Array.from({ length: mode === "descent" ? 140 : 120 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: 1 + Math.random() * 2,
      opacity: 0.48 + Math.random() * 0.52,
    }))
    setStars(generated)
  }, [])

  return (
    <div
      className={mode === "descent" ? "starfield-descent" : "absolute inset-0"}
      aria-hidden="true"
    >
      {mode === "descent" ? (
        <div className="starfield-descent-track">
          <div className="absolute inset-x-0 top-0 h-screen">
            {stars.map((star, i) => (
              <Star key={`top-${i}`} {...star} mode={mode} />
            ))}
          </div>
          <div className="absolute inset-x-0 top-[100vh] h-screen">
            {stars.map((star, i) => (
              <Star key={`bottom-${i}`} {...star} mode={mode} />
            ))}
          </div>
        </div>
      ) : (
        stars.map((star, i) => (
          <Star key={i} {...star} mode={mode} />
        ))
      )}
    </div>
  )
}
