import { useEffect, useState } from "react"


function getSkyPhase(hour: number) {
  if (hour >= 5 && hour < 8) {
    return "sunrise"
  }

  if (hour >= 8 && hour < 17) {
    return "day"
  }

  if (hour >= 17 && hour < 20) {
    return "sunset"
  }

  return "night"
}

const cycle_duration = 120


export default function SkyBackground() {

    const [hour, setHour] = useState(0)
    // const [hour, setHour] = useState(new Date().getHours())
    const skyPhase = getSkyPhase(hour)

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //     setHour(new Date().getHours())
    //     }, 1000)

    //     return () => clearInterval(interval)
    // }, [])

    

    useEffect(() => {
      const startTime = performance.now()
      let frame: number

      function tick() {
        const elapsed = (performance.now() - startTime) / 1000
        const t = (elapsed % cycle_duration) / cycle_duration  // 0–1
        setHour(Math.floor(t * 24))  // 0–23
        frame = requestAnimationFrame(tick)
      }

      frame = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(frame)
    }, [])

  
    const isNight = hour < 5 || hour >= 20
    const isDay = hour >= 5 && hour < 20
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className={`sky-layer bg-[linear-gradient(to_bottom,#fb923c,#fdba74,#fed7aa)] ${skyPhase === "sunrise" ? "sky-visible" : "sky-hidden"}`} />
      <div className={`sky-layer bg-[linear-gradient(to_bottom,#3b82f6,#93c5fd,#bfdbfe)] ${skyPhase === "day" ? "sky-visible" : "sky-hidden"}`} />
      <div className={`sky-layer bg-[linear-gradient(to_bottom,#312e81,#7c2d12,#fb923c)] ${skyPhase === "sunset" ? "sky-visible" : "sky-hidden"}`} />
      <div className={`sky-layer bg-[linear-gradient(to_bottom,#0f172a,#1e293b,#334155)] ${skyPhase === "night" ? "sky-visible" : "sky-hidden"}`} />

      <div className={`stars stars-near ${isNight ? "stars-visible" : "stars-hidden"}`} />
      <div className={`stars stars-far ${isNight ? "stars-visible" : "stars-hidden"}`} />

      <div className={`sky-orb sky-sun top-16 right-24 ${isDay ? "orb-visible" : "orb-hidden"}`} />
      <div className={`sky-orb sky-moon top-16 right-24 ${isNight ? "orb-visible" : "orb-hidden"}`} />

      <div className="cloud cloud-1 top-24">
        <span className="cloud-shadow" />
        <span className="cloud-puff puff-1" />
        <span className="cloud-puff puff-2" />
        <span className="cloud-puff puff-3" />
        <span className="cloud-puff puff-4" />
        <span className="cloud-puff puff-5" />
        <span className="cloud-puff puff-6" />
      </div>

      <div className="cloud cloud-2 top-44 delay-1">
        <span className="cloud-shadow" />
        <span className="cloud-puff puff-1" />
        <span className="cloud-puff puff-2" />
        <span className="cloud-puff puff-3" />
        <span className="cloud-puff puff-4" />
        <span className="cloud-puff puff-5" />
        <span className="cloud-puff puff-6" />
      </div>

      <div className="cloud cloud-3 top-72 delay-2">
        <span className="cloud-shadow" />
        <span className="cloud-puff puff-1" />
        <span className="cloud-puff puff-2" />
        <span className="cloud-puff puff-3" />
        <span className="cloud-puff puff-4" />
        <span className="cloud-puff puff-5" />
        <span className="cloud-puff puff-6" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1/3 animate-mist bg-gradient-to-t from-white/35 to-transparent" />
    </div>
  )
}
