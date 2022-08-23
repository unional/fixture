import assert from 'assert'
import { AssertOrder } from 'assertron'
import { createStandardLogForTest, StandardLogForTest } from 'standard-log'

import { context } from './context.js'
import { baseline } from './index.js'

let sl: StandardLogForTest

beforeEach(() => {
  sl = createStandardLogForTest()
  context.log = sl.getLogger('standard-log')
})

test('filter cases using RegExp', () => {
  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: /file1/,
    suppressFilterWarnings: true
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
    filter: '*1.*',
    suppressFilterWarnings: true
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
    filter: '!file1.txt',
    suppressFilterWarnings: true
  }, ({ caseName }) => {
    assert.strictEqual(caseName, 'file2.txt')
    o.once(1)
  })
  o.end()
})


test('log filtered case', () => {
  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: '!file1.txt'
  }, ({ caseName }) => {
    assert.strictEqual(caseName, 'file2.txt')
    o.once(1)
  })

  assert.strictEqual(sl.reporter.logs.length, 1)
  o.end()
})


test('suppressFilterWarning option will skip log filtered case', () => {
  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: '!file1.txt',
    suppressFilterWarnings: true
  }, ({ caseName }) => {
    assert.strictEqual(caseName, 'file2.txt')
    o.once(1)
  })

  assert.strictEqual(sl.reporter.logs.length, 0)
  o.end()
})
