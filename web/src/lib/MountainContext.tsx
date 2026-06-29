/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Route, Waypoint } from "../../../shared/schema"

export type MountainRecord = {
  id: string
  route: Route
  createdAt: string
}

type MountainContextValue = {
  mountains: MountainRecord[]
  activeMountain: MountainRecord | null
  activeMountainId: string | null
  createMountain: (route: Route) => MountainRecord
  selectMountain: (id: string) => void
}

const MOUNTAINS_STORAGE_KEY = "peak_mountains"
const ACTIVE_MOUNTAIN_STORAGE_KEY = "peak_active_mountain_id"

const MountainContext = createContext<MountainContextValue | undefined>(undefined)

function storageAvailable() {
  return typeof window !== "undefined" && Boolean(window.localStorage)
}

function isWaypoint(value: unknown): value is Waypoint {
  if (!value || typeof value !== "object") return false
  const waypoint = value as Partial<Waypoint>
  return (
    typeof waypoint.id === "number" &&
    typeof waypoint.title === "string" &&
    typeof waypoint.summary === "string" &&
    typeof waypoint.x === "number" &&
    typeof waypoint.y === "number" &&
    Boolean(waypoint.challenge)
  )
}

function isRoute(value: unknown): value is Route {
  if (!value || typeof value !== "object") return false
  const route = value as Partial<Route>
  return (
    typeof route.skill === "string" &&
    typeof route.estimatedHours === "number" &&
    Array.isArray(route.route) &&
    route.route.every(isWaypoint)
  )
}

function isMountainRecord(value: unknown): value is MountainRecord {
  if (!value || typeof value !== "object") return false
  const mountain = value as Partial<MountainRecord>
  return (
    typeof mountain.id === "string" &&
    typeof mountain.createdAt === "string" &&
    isRoute(mountain.route)
  )
}

function readStoredMountains(): MountainRecord[] {
  if (!storageAvailable()) return []

  try {
    const saved = window.localStorage.getItem(MOUNTAINS_STORAGE_KEY)
    if (!saved) return []

    const parsed = JSON.parse(saved) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isMountainRecord)
  } catch {
    return []
  }
}

function readStoredActiveMountainId(): string | null {
  if (!storageAvailable()) return null

  try {
    return window.localStorage.getItem(ACTIVE_MOUNTAIN_STORAGE_KEY)
  } catch {
    return null
  }
}

function createMountainId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function MountainProvider({ children }: { children: ReactNode }) {
  const [mountains, setMountains] = useState<MountainRecord[]>(() => readStoredMountains())
  const [activeMountainId, setActiveMountainId] = useState<string | null>(() => readStoredActiveMountainId())

  const activeMountain = useMemo(() => {
    if (activeMountainId) {
      const selectedMountain = mountains.find((mountain) => mountain.id === activeMountainId)
      if (selectedMountain) return selectedMountain
    }

    return mountains[0] ?? null
  }, [activeMountainId, mountains])

  const resolvedActiveMountainId = activeMountain?.id ?? null

  useEffect(() => {
    if (!storageAvailable()) return
    window.localStorage.setItem(MOUNTAINS_STORAGE_KEY, JSON.stringify(mountains))
  }, [mountains])

  useEffect(() => {
    if (!storageAvailable()) return

    if (resolvedActiveMountainId) {
      window.localStorage.setItem(ACTIVE_MOUNTAIN_STORAGE_KEY, resolvedActiveMountainId)
      return
    }

    window.localStorage.removeItem(ACTIVE_MOUNTAIN_STORAGE_KEY)
  }, [resolvedActiveMountainId])

  const createMountain = useCallback((route: Route) => {
    const newMountain: MountainRecord = {
      id: createMountainId(),
      route,
      createdAt: new Date().toISOString(),
    }

    setMountains((currentMountains) => [...currentMountains, newMountain])
    setActiveMountainId(newMountain.id)
    return newMountain
  }, [])

  const selectMountain = useCallback((id: string) => {
    setActiveMountainId((currentId) => {
      if (!mountains.some((mountain) => mountain.id === id)) return currentId
      return id
    })
  }, [mountains])

  const value = useMemo(
    () => ({ mountains, activeMountain, activeMountainId: resolvedActiveMountainId, createMountain, selectMountain }),
    [activeMountain, createMountain, mountains, resolvedActiveMountainId, selectMountain],
  )

  return (
    <MountainContext.Provider value={value}>
      {children}
    </MountainContext.Provider>
  )
}

export function useMountain() {
  const context = useContext(MountainContext)
  if (!context) {
    throw new Error("useMountain must be used within a MountainProvider")
  }

  return context
}
