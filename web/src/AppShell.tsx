import { useEffect, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { useMountain } from "./lib/MountainContext"
import StarField from "./components/Starfield"

type AppShellProps = {
  children: ReactNode
}

const SWITCH_ASCENT_MS = 850
const SWITCH_DESCENT_MS = 950
type SwitchPhase = "idle" | "ascending" | "descending"

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const { mountains, activeMountainId } = useMountain()
  const [switchPhase, setSwitchPhase] = useState<SwitchPhase>("idle")
  const [switchingToMountainId, setSwitchingToMountainId] = useState<string | null>(null)
  const showMountainSelector = mountains.length > 0

  function handleSelectMountain(mountainId: string) {
    if (!mountainId) return
    if (mountainId === activeMountainId || switchPhase !== "idle") return

    setSwitchingToMountainId(mountainId)
    setSwitchPhase("ascending")
  }

  useEffect(() => {
    if (switchPhase !== "ascending" || !switchingToMountainId) return

    const timeout = window.setTimeout(() => {
      navigate(`/mountain/${switchingToMountainId}`)
      setSwitchPhase("descending")
    }, SWITCH_ASCENT_MS)

    return () => window.clearTimeout(timeout)
  }, [navigate, switchPhase, switchingToMountainId])

  useEffect(() => {
    if (switchPhase !== "descending") return

    const timeout = window.setTimeout(() => {
      setSwitchPhase("idle")
      setSwitchingToMountainId(null)
    }, SWITCH_DESCENT_MS)

    return () => window.clearTimeout(timeout)
  }, [switchPhase])

  return (
    <>
      {showMountainSelector && (
        <div className="peak-app-shell-mountain-selector" aria-label="Mountain selector">
          <label htmlFor="peak-mountain-selector">Mountain</label>
          <select
            id="peak-mountain-selector"
            value={activeMountainId ?? ""}
            onChange={(event) => handleSelectMountain(event.target.value)}
          >
            {mountains.map((mountain) => (
              <option key={mountain.id} value={mountain.id}>
                {mountain.route.skill}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className={`peak-route-surface peak-route-surface-${switchPhase}`}>
        {children}
      </div>
      {switchPhase !== "idle" && (
        <div className={`peak-mountain-switch-overlay peak-mountain-switch-${switchPhase}`} aria-hidden="true">
          <StarField mode={switchPhase === "ascending" ? "ascent" : "descent"} />
        </div>
      )}
    </>
  )
}
