// PEAK — shared JSON contract between AI, backend, and frontend.
// DO NOT change this without team agreement on voice call.

export type ChallengeType = 'text' | 'photo' | 'code' | 'pdf'

export type Challenge = {
  type: ChallengeType
  prompt: string
}

export type Waypoint = {
  id: number
  title: string
  summary: string
  challenge: Challenge
  difficulty: 1 | 2 | 3 | 4 | 5
  x: number  // 0-1, normalized horizontal position on mountain
  y: number  // 0-1, normalized vertical position (lower y = higher on mountain)
}

export type Route = {
  skill: string
  estimatedHours: number
  route: Waypoint[]
}

export type Feedback = {
  feedback: string
  passed: boolean
}
