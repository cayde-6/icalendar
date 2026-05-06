import { execFileSync } from 'node:child_process'

const run = (args) => {
  const output = execFileSync('node', ['dist/cli.js', ...args, '--json'], { encoding: 'utf8' })
  return JSON.parse(output)
}

const summary = `CI smoke ${new Date().toISOString()}`
const start = new Date(Date.now() + 60 * 60 * 1000)
const end = new Date(start.getTime() + 30 * 60 * 1000)
const format = (date) => date.toISOString().replace('.000Z', 'Z')

const created = run([
  'events', 'create',
  '--summary', summary,
  '--start', format(start),
  '--end', format(end),
  '--description', 'Automated GitHub Actions smoke test',
  '--location', 'GitHub Actions',
])

if (!created.ok || !created.url) {
  throw new Error(`Create failed: ${JSON.stringify(created)}`)
}

try {
  const updated = run([
    'events', 'update',
    '--url', created.url,
    '--summary', `${summary} updated`,
    '--start', format(start),
    '--end', format(end),
    '--description', 'Automated GitHub Actions smoke test updated',
    '--location', 'GitHub Actions',
  ])

  if (!updated.ok) {
    throw new Error(`Update failed: ${JSON.stringify(updated)}`)
  }
} finally {
  const deleted = run(['events', 'delete', created.url])
  if (!deleted.ok) {
    throw new Error(`Delete failed: ${JSON.stringify(deleted)}`)
  }
}
