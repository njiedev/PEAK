// Scratch test for evaluateSubmission. Not part of the real flow.
//
// Text submission:
//   npx tsx --env-file=.env ai/testEvaluate.ts text "the shadow is on the right side"
//
// Photo submission (path to a local image file, JPEG or PNG):
//   npx tsx --env-file=.env ai/testEvaluate.ts photo ./my-drawing.jpg
//
// Defaults to the shadow text challenge if no args given.

import { promises as fs } from 'fs'
import path from 'path'
import type { Waypoint } from '../shared/schema'
import { evaluateSubmission } from './evaluate'
const SAMPLE_TEXT_WAYPOINT: Waypoint = {
  id: 4,
  title: 'Where does the shadow fall?',
  summary: 'Light always comes from somewhere, and shadows always fall on the opposite side.',
  challenge: {
    type: 'text',
    prompt: 'A lamp is shining on a ball from the LEFT side. Which side of the ball is in shadow? Tell me in your own words.',
  },
  difficulty: 2,
  x: 0,
  y: 0,
}

const SAMPLE_PHOTO_WAYPOINT: Waypoint = {
  id: 1,
  title: 'Draw five circles',
  summary: "Warm up your hand with the simplest shape there is.",
  challenge: {
    type: 'photo',
    prompt: 'Grab any paper and pen. Draw five circles, each about the size of a coin. Snap a photo and upload it.',
  },
  difficulty: 1,
  x: 0,
  y: 0,
}

async function main() {
  const mode = process.argv[2] || 'text'
  const arg = process.argv[3] || 'the shadow is on the right side of the ball'

  let waypoint: Waypoint
  let submission: string | { imageBase64: string }

  if (mode === 'text') {
    waypoint = SAMPLE_TEXT_WAYPOINT
    submission = arg
    console.log(`Evaluating text submission for "${waypoint.title}"\n`)
    console.log(`Submission: ${arg}\n`)
  } else if (mode === 'photo') {
    waypoint = SAMPLE_PHOTO_WAYPOINT
    const filePath = path.resolve(arg)
    const buf = await fs.readFile(filePath)
    submission = { imageBase64: buf.toString('base64') }
    console.log(`Evaluating photo submission for "${waypoint.title}"`)
    console.log(`Image: ${filePath} (${buf.length} bytes)\n`)
  } else {
    console.error('Usage: testEvaluate.ts [text|photo] [submission-or-path]')
    process.exit(1)
  }

  const start = Date.now()
  const feedback = await evaluateSubmission(waypoint, submission)
  const ms = Date.now() - start

  console.log(JSON.stringify(feedback, null, 2))
  console.log(`\nDone in ${(ms / 1000).toFixed(1)}s`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
