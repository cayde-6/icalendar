import test from 'node:test'
import assert from 'node:assert/strict'

import { printError } from '../src/app/commands/runtime.js'
import { CliError } from '../src/shared/errors/cli-error.js'

const captureStderr = (fn: () => void) => {
  const logs: string[] = []
  const original = console.error
  console.error = (...args) => logs.push(args.join(' '))
  try {
    fn()
  } finally {
    console.error = original
  }
  return logs.join('\n')
}

test('printError renders cli errors as json when requested', () => {
  const output = captureStderr(() => {
    printError(['events', 'create', '--json'], new CliError('bad_input', 'Nope'))
  })

  assert.match(output, /"ok": false/)
  assert.match(output, /"code": "bad_input"/)
  assert.match(output, /"message": "Nope"/)
})

test('printError renders plain text without --json', () => {
  const output = captureStderr(() => {
    printError(['events', 'create'], new Error('Boom'))
  })

  assert.equal(output, 'Boom')
})
