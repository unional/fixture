import { config, createMemoryLogReporter, logLevels } from 'standard-log'
import assert from 'assert'
import { AssertOrder } from 'assertron'

import { baseline } from '.'

beforeAll(() => {
  config({
    logLevel: logLevels.none,
    mode: 'test'
  })
})

test('filter cases using RegExp', () => {
  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: /file1/
  }, ({ caseName }) => {
    assert.strictEqual(caseName, 'file1.txt')
    o.once(1)
  })

  o.end()
})

test('filter cases using wildcards', () => {
  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: '*1.*'
  }, ({ caseName }) => {
    assert.strictEqual(caseName, 'file1.txt')
    o.once(1)
  })

  o.end()
})

test('filter with negate keeps others', () => {
  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: '!file1.txt'
  }, ({ caseName }) => {
    assert.strictEqual(caseName, 'file2.txt')
    o.once(1)
  })
  o.end()
})


test('log filtered case', () => {
  const mem = createMemoryLogReporter()
  config({
    logLevel: logLevels.warn,
    reporters: [mem],
    mode: 'test'
  })

  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: '!file1.txt'
  }, ({ caseName }) => {
    assert.strictEqual(caseName, 'file2.txt')
    o.once(1)
  })

  assert.strictEqual(mem.logs.length, 1)
  o.end()
})


test('suppressFilterWarning option will skip log filtered case', () => {
  const mem = createMemoryLogReporter()
  config({
    logLevel: logLevels.warn,
    reporters: [mem],
    mode: 'test'
  })

  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: '!file1.txt',
    suppressFilterWarnings: true
  }, ({ caseName }) => {
    assert.strictEqual(caseName, 'file2.txt')
    o.once(1)
  })

  assert.strictEqual(mem.logs.length, 0)
  o.end()
})
