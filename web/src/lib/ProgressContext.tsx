import React, { createContext, useContext, useState, useEffect } from 'react'

type ProgressContextType = {
  completedWaypoints: number[]
  markCompleted: (waypointId: number) => void
  isCompleted: (waypointId: number) => boolean
  activeIndex: number
  resetProgress: () => void
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [completedWaypoints, setCompletedWaypoints] = useState<number[]>(() => {
    const saved = localStorage.getItem('peak_completed_waypoints')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('peak_completed_waypoints', JSON.stringify(completedWaypoints))
  }, [completedWaypoints])

  const markCompleted = (waypointId: number) => {
    setCompletedWaypoints((prev) => {
      if (prev.includes(waypointId)) return prev
      return [...prev, waypointId]
    })
  }

  const isCompleted = (waypointId: number) => completedWaypoints.includes(waypointId)

  const activeIndex = completedWaypoints.length

  const resetProgress = () => {
    setCompletedWaypoints([])
    localStorage.removeItem('peak_completed_waypoints')
  }

  return (
    <ProgressContext.Provider value={{ completedWaypoints, markCompleted, isCompleted, activeIndex, resetProgress }}>
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
