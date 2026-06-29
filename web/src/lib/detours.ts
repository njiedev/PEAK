import type { Detour } from "../../../shared/schema"

const ACTIVE_DETOUR_STORAGE_KEY_PREFIX = "peak_active_detour"
const COMPLETED_DETOURS_STORAGE_KEY_PREFIX = "peak_completed_detours"

export function routeStorageScope(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "default"
}

function activeDetourKey(scope: string, waypointId: number): string {
  return `${ACTIVE_DETOUR_STORAGE_KEY_PREFIX}_${scope}_${waypointId}`
}

function completedDetoursKey(scope: string): string {
  return `${COMPLETED_DETOURS_STORAGE_KEY_PREFIX}_${scope}`
}

export function readActiveDetour(scope: string, waypointId: number): Detour | null {
  try {
    const saved = window.localStorage.getItem(activeDetourKey(scope, waypointId))
    return saved ? JSON.parse(saved) as Detour : null
  } catch {
    return null
  }
}

export function readActiveDetours(scope: string, waypointIds: number[]): Detour[] {
  return waypointIds
    .map((waypointId) => readActiveDetour(scope, waypointId))
    .filter((detour): detour is Detour => Boolean(detour))
}

export function saveActiveDetour(scope: string, detour: Detour): void {
  window.localStorage.setItem(activeDetourKey(scope, detour.parentWaypointId), JSON.stringify(detour))
}

export function clearActiveDetour(scope: string, waypointId: number): void {
  window.localStorage.removeItem(activeDetourKey(scope, waypointId))
}

export function readCompletedDetours(scope: string): string[] {
  try {
    const saved = window.localStorage.getItem(completedDetoursKey(scope))
    return saved ? JSON.parse(saved) as string[] : []
  } catch {
    return []
  }
}

export function isDetourCompleted(scope: string, detourId: string): boolean {
  return readCompletedDetours(scope).includes(detourId)
}

export function markDetourCompleted(scope: string, detourId: string): void {
  const completed = readCompletedDetours(scope)
  if (completed.includes(detourId)) return
  window.localStorage.setItem(completedDetoursKey(scope), JSON.stringify([...completed, detourId]))
}
