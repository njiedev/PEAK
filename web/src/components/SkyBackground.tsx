import { useEffect, useState } from "react"


function getSkyClass(hour: number) {
  if (hour >= 5 && hour < 8) {
    return "bg-[linear-gradient(to_bottom,#fb923c,#fdba74,#fed7aa)]" // sunrise
  }

  if (hour >= 8 && hour < 17) {
    return "bg-[linear-gradient(to_bottom,#3b82f6,#93c5fd,#bfdbfe)]" // day
  }

  if (hour >= 17 && hour < 20) {
    return "bg-[linear-gradient(to_bottom,#312e81,#7c2d12,#fb923c)]" // sunset
  }

  return "bg-[linear-gradient(to_bottom,#0f172a,#1e293b,#334155)]" // night
}




export default function SkyBackground() {

    const [hour, setHour] = useState(new Date().getHours())

    useEffect(() => {
        const interval = setInterval(() => {
        setHour(new Date().getHours())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const isNight = hour < 5 || hour >= 20
    const isDay = hour >= 5 && hour < 20
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 transition-all duration-[3000ms] ${getSkyClass(hour)}`} />

      <div className={`stars stars-near ${isNight ? "stars-visible" : "stars-hidden"}`} />
      <div className={`stars stars-far ${isNight ? "stars-visible" : "stars-hidden"}`} />

      <div className={`sky-orb sky-sun top-16 right-24 ${isDay ? "opacity-100" : "opacity-0"}`} />
      <div className={`sky-orb sky-moon top-16 right-24 ${isNight ? "opacity-100" : "opacity-0"}`} />

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
