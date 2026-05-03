import React, { createContext, useCallback, useContext, useState, useEffect } from 'react'

type ProgressContextType = {
  progressScope: string
  completedWaypoints: number[]
  markCompleted: (waypointId: number) => void
  setCompleted: (waypointIds: number[]) => void
  setProgressScope: (scope: string) => void
  isCompleted: (waypointId: number) => boolean
  activeIndex: number
  resetProgress: () => void
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)
const DEFAULT_PROGRESS_SCOPE = 'default'

function progressStorageKey(scope: string) {
  return `peak_completed_waypoints_${scope || DEFAULT_PROGRESS_SCOPE}`
}

function readCompletedWaypoints(scope: string) {
  const scoped = localStorage.getItem(progressStorageKey(scope))
  if (scoped) return JSON.parse(scoped) as number[]

  if (scope === DEFAULT_PROGRESS_SCOPE) {
    const legacy = localStorage.getItem('peak_completed_waypoints')
    if (legacy) return JSON.parse(legacy) as number[]
  }

  return []
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progressScope, setProgressScope] = useState(DEFAULT_PROGRESS_SCOPE)
  const [completedWaypoints, setCompletedWaypoints] = useState<number[]>(() => {
    return readCompletedWaypoints(DEFAULT_PROGRESS_SCOPE)
  })

  useEffect(() => {
    setCompletedWaypoints(readCompletedWaypoints(progressScope))
  }, [progressScope])

  useEffect(() => {
    localStorage.setItem(progressStorageKey(progressScope), JSON.stringify(completedWaypoints))
  }, [completedWaypoints, progressScope])

  const markCompleted = useCallback((waypointId: number) => {
    setCompletedWaypoints((prev) => {
      if (prev.includes(waypointId)) return prev
      return [...prev, waypointId]
    })
  }, [])

  const setCompleted = useCallback((waypointIds: number[]) => {
    setCompletedWaypoints((prev) => {
      const next = [...new Set(waypointIds)]
      if (prev.length === next.length && prev.every((id, index) => id === next[index])) return prev
      return next
    })
  }, [])

  const isCompleted = (waypointId: number) => completedWaypoints.includes(waypointId)

  const activeIndex = completedWaypoints.length

  const resetProgress = () => {
    setCompletedWaypoints([])
    localStorage.removeItem(progressStorageKey(progressScope))
  }

  return (
    <ProgressContext.Provider value={{ progressScope, completedWaypoints, markCompleted, setCompleted, setProgressScope, isCompleted, activeIndex, resetProgress }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}
