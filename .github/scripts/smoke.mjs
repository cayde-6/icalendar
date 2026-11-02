// Install the packed package into a temporary prefix and exercise its CLI
// without credentials or a connection to a calendar server.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const isWin = process.platform === 'win32'
const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
const tarballs = readdirSync('.smoke').filter(file => file.endsWith('.tgz'))
assert.equal(tarballs.length, 1, 'expected exactly one tarball in .smoke')
// An absolute path avoids npm interpreting ".smoke/file.tgz" as GitHub shorthand.
const tarball = resolve('.smoke', tarballs[0])
const prefix = mkdtempSync(join(tmpdir(), 'icalendar smoke-'))
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('CALDAV_')))
const options = { encoding: 'utf8', cwd: prefix, env, timeout: 120_000 }

try {
  // npm and its generated CLI shim are .cmd files on Windows; quote paths
  // there because the temporary prefix can contain spaces.
  execFileSync(isWin ? 'npm.cmd' : 'npm', [
    'install', '-g', '--ignore-scripts', '--prefix', isWin ? `"${prefix}"` : prefix,
    isWin ? `"${tarball}"` : tarball,
  ], { ...options, shell: isWin, stdio: 'inherit' })

  const bin = isWin ? join(prefix, 'icalendar.cmd') : join(prefix, 'bin', 'icalendar')
  assert.ok(existsSync(bin), 'expected installed icalendar executable')
  const run = args => execFileSync(isWin ? `"${bin}"` : bin, args, { ...options, shell: isWin })
  assert.equal(run(['--version']).trim().split(/\s+/)[0], `icalendar/${version}`)
  assert.match(run(['--help']), /Usage:/)
  console.log(`smoke test passed: icalendar/${version}`)
} finally {
  rmSync(prefix, { recursive: true, force: true })
}
