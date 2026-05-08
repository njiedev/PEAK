import { type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { useMountain } from "./lib/MountainContext"

type AppShellProps = {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const { mountains, activeMountainId } = useMountain()
  const showMountainSelector = mountains.length > 0

  function handleSelectMountain(mountainId: string) {
    if (!mountainId) return
    navigate(`/mountain/${mountainId}`)
    console.log(activeMountainId)
  }

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
      {children}
    </>
  )
}
