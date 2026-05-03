import { useEffect, useState } from "react"

function Star({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute w-1 h-1 bg-white"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: `blink 2s ${delay}s infinite`,
      }}
    />
  )
}

export default function StarField() {
  const [stars, setStars] = useState<{ x: number; y: number; delay: number }[]>([])

  useEffect(() => {
    const generated = Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }))
    setStars(generated)
  }, [])

  return (
    <>
      {stars.map((star, i) => (
        <Star key={i} {...star} />
      ))}
    </>
  )
}