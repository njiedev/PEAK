// Used by generate.ts when the first response fails JSON.parse or Zod validation.
// We send Claude back its own broken output plus the error and ask for a fix.

export function buildRepairMessage(brokenOutput: string, errorMessage: string): string {
  return `Your previous response could not be used. It failed with this error:

${errorMessage}

Here is the output you produced:

${brokenOutput}

Return a corrected JSON object that follows the schema exactly. Respond with ONLY the JSON. No prose, no markdown fences.`
}
