export default function SkyBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 animate-sky bg-[linear-gradient(to_bottom,#3b82f6,#93c5fd,#fed7aa)]" />

      <div className="stars stars-near" />
      <div className="stars stars-far" />

      <div className="sky-orb sky-sun top-16 right-24" />
      <div className="sky-orb sky-moon top-16 right-24" />

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
