import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const registry = '--registry=https://registry.npmjs.org/'
const options = { encoding: 'utf8', timeout: 30_000, stdio: 'pipe' }

export function isPublished(name, version, run = execFileSync) {
  let output
  try {
    output = run('npm', ['view', `${name}@${version}`, 'version', '--json', registry], options)
  } catch (error) {
    // Only a registry E404 means "not published". Network, auth and other
    // failures must stop the release instead of allowing a publish attempt.
    let code
    try {
      code = JSON.parse(String(error.stdout)).error?.code
    } catch {}
    if (code === 'E404') return false
    throw error
  }
  if (JSON.parse(output) !== version) throw new Error('Unexpected registry version')
  return true
}

export function assertPublishedTarball(name, version, tarball, run = execFileSync) {
  const integrity = JSON.parse(run('npm', [
    'view', `${name}@${version}`, 'dist.integrity', '--json', registry,
  ], options))
  const actual = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`
  if (integrity !== actual) {
    throw new Error('Published package differs from the verified tarball; use a new version')
  }
}

export const EXIT_PUBLISHED = 0
export const EXIT_NOT_PUBLISHED = 1
export const EXIT_USAGE_ERROR = 2
export const EXIT_UNEXPECTED_ERROR = 3

export function exitCodeFor(name, version, checkPublished = isPublished) {
  if (!name || !version) return EXIT_USAGE_ERROR
  try {
    return checkPublished(name, version) ? EXIT_PUBLISHED : EXIT_NOT_PUBLISHED
  } catch {
    return EXIT_UNEXPECTED_ERROR
  }
}

function main() {
  const [, , name, version, tarball] = process.argv
  let code = exitCodeFor(name, version)
  if (code === EXIT_PUBLISHED && tarball) {
    try {
      assertPublishedTarball(name, version, tarball)
    } catch {
      console.error('Published tarball could not be verified; refusing to continue')
      code = EXIT_UNEXPECTED_ERROR
    }
  } else if (code === EXIT_USAGE_ERROR) {
    console.error('usage: npm-published.mjs <name> <version> [tarball]')
  } else if (code === EXIT_UNEXPECTED_ERROR) {
    console.error('Registry publication check failed; refusing to continue')
  }
  process.exitCode = code
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main()
}
