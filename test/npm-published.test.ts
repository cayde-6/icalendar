import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  assertPublishedTarball,
  exitCodeFor,
  isPublished,
  EXIT_NOT_PUBLISHED,
  EXIT_PUBLISHED,
  EXIT_UNEXPECTED_ERROR,
  EXIT_USAGE_ERROR,
} from '../.github/scripts/npm-published.mjs'

const name = '@example.test/calendar'
const version = '1.2.3'
const script = fileURLToPath(new URL('../.github/scripts/npm-published.mjs', import.meta.url))

test('publication check queries the exact version on the public registry with a timeout', () => {
  assert.equal(isPublished(name, version, (file, args, options) => {
    assert.equal(file, 'npm')
    assert.deepEqual(args, [
      'view', `${name}@${version}`, 'version', '--json', '--registry=https://registry.npmjs.org/',
    ])
    assert.equal(options.timeout, 30_000)
    return JSON.stringify(version)
  }), true)
})

test('only a structured npm E404 means the version is absent', () => {
  const notFound = Object.assign(new Error('not found'), {
    stdout: JSON.stringify({ error: { code: 'E404' } }),
  })
  const check = () => isPublished(name, version, () => { throw notFound })
  assert.equal(check(), false)
  assert.equal(exitCodeFor(name, version, check), EXIT_NOT_PUBLISHED)
})

for (const code of ['E401', 'E403', 'ECONNRESET', 'ETIMEDOUT', 'E500']) {
  test(`registry ${code} stops the release instead of treating the version as absent`, () => {
    const error = Object.assign(new Error('registry unavailable'), {
      stdout: JSON.stringify({ error: { code } }),
    })
    const check = () => isPublished(name, version, () => { throw error })
    assert.throws(check, error)
    assert.equal(exitCodeFor(name, version, check), EXIT_UNEXPECTED_ERROR)
  })
}

test('missing npm and malformed registry responses stop the release', () => {
  assert.equal(exitCodeFor(name, version, () => isPublished(name, version, () => {
    throw Object.assign(new Error('missing executable'), { code: 'ENOENT' })
  })), EXIT_UNEXPECTED_ERROR)
  for (const response of ['', 'not json', 'null', '"1.2.4"', '["1.2.3"]']) {
    assert.equal(exitCodeFor(name, version, () => isPublished(name, version, () => response)), EXIT_UNEXPECTED_ERROR)
  }
})

test('publication exit codes distinguish existing versions, missing versions and invalid usage', () => {
  assert.equal(exitCodeFor(name, version, () => true), EXIT_PUBLISHED)
  assert.equal(exitCodeFor(name, version, () => false), EXIT_NOT_PUBLISHED)
  const mustNotRun = () => { throw new Error('registry must not be queried') }
  assert.equal(exitCodeFor(undefined, version, mustNotRun), EXIT_USAGE_ERROR)
  assert.equal(exitCodeFor(name, undefined, mustNotRun), EXIT_USAGE_ERROR)
})

test('published tarball must match the verified package integrity', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'icalendar-integrity-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const tarball = join(dir, 'synthetic.tgz')
  const contents = 'synthetic package contents'
  writeFileSync(tarball, contents)
  const integrity = `sha512-${createHash('sha512').update(contents).digest('base64')}`
  assert.doesNotThrow(() => assertPublishedTarball(name, version, tarball, (_file, args) => {
    assert.ok(args.includes('dist.integrity'))
    return JSON.stringify(integrity)
  }))
  assert.throws(() => assertPublishedTarball(name, version, tarball, () => '"sha512-different"'), /differs/)
  assert.throws(() => assertPublishedTarball(name, version, tarball, () => { throw new Error('offline') }), /offline/)
})

test('CLI invoked directly or through a symlink returns usage error without a registry query', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'icalendar-script-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const link = join(dir, 'npm-published.mjs')
  symlinkSync(script, link)
  for (const path of [script, link]) {
    assert.throws(() => execFileSync(process.execPath, [path], { stdio: 'pipe' }), error => {
      assert.equal((error as { status: number }).status, EXIT_USAGE_ERROR)
      return true
    })
  }
})
