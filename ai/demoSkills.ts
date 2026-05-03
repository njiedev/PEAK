export const DEMO_SKILLS = [
  'i want to start a minecraft server',
] as const

export type DemoSkill = (typeof DEMO_SKILLS)[number]

export function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isDemoSkill(skill: string): skill is DemoSkill {
  const normalized = normalizeSkill(skill)
  return DEMO_SKILLS.some((demoSkill) => demoSkill === normalized)
}
