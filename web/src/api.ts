import type { Route, Waypoint, Feedback, Detour } from '../../shared/schema'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type ApiSuccess<T> = {
  ok: true
  data: T
}

type ApiFailure = {
  ok: false
  error: string
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure

const pendingRouteRequests = new Map<string, Promise<Route>>()

export async function generateRoute(skill: string): Promise<Route> {
  const trimmedSkill = skill.trim()
  const pendingRequest = pendingRouteRequests.get(trimmedSkill)
  if (pendingRequest) {
    console.log('[api] reusing pending route request', { skill: trimmedSkill })
    return pendingRequest
  }

  console.log('[api] generating route', {
    apiUrl: API_URL,
    skill: trimmedSkill,
  })

  const request = fetch(`${API_URL}/api/generate-route`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ skill: trimmedSkill }),
  })
    .then(async (response) => {
      console.log('[api] generate-route response received', {
        status: response.status,
        ok: response.ok,
      })

      const json = (await response.json()) as ApiResponse<Route>

      if (!response.ok || !json.ok) {
        throw new Error(json.ok ? 'route generation failed' : json.error)
      }

      console.log('[api] route ready', {
        skill: json.data.skill,
        waypoints: json.data.route.length,
      })

      return json.data
    })
    .finally(() => {
      pendingRouteRequests.delete(trimmedSkill)
    })

  pendingRouteRequests.set(trimmedSkill, request)
  return request
}

export async function evaluateSubmission(
  waypoint: Waypoint,
  submission: { text?: string; imageBase64?: string; imageMime?: string },
): Promise<Feedback> {
  console.log('[api] evaluating submission', {
    waypointId: waypoint.id,
    type: waypoint.challenge.type,
    hasText: !!submission.text,
    hasImage: !!submission.imageBase64,
    mime: submission.imageMime,
  })

  const response = await fetch(`${API_URL}/api/evaluate-submission`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ waypoint, submission }),
  })

  const json = (await response.json()) as ApiResponse<Feedback>

  if (!response.ok || !json.ok) {
    throw new Error(json.ok ? 'submission evaluation failed' : json.error)
  }

  console.log('[api] evaluation complete', {
    passed: json.data.passed,
  })

  return json.data
}

export async function generateDetour(input: {
  skill: string
  waypoint: Waypoint
  feedback: Feedback
  submissionText?: string
  routeContext?: Route
}): Promise<Detour> {
  console.log('[api] generating detour', {
    skill: input.skill,
    waypointId: input.waypoint.id,
    hasMissingSkill: !!input.feedback.missingSkill,
  })

  const response = await fetch(`${API_URL}/api/generate-detour`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const json = (await response.json()) as ApiResponse<Detour>

  if (!response.ok || !json.ok) {
    throw new Error(json.ok ? 'detour generation failed' : json.error)
  }

  console.log('[api] detour ready', {
    detourId: json.data.id,
    parentWaypointId: json.data.parentWaypointId,
  })

  return json.data
}
