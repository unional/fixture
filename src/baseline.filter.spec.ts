import { clearAppenders, setLevel, logLevel, addAppender } from '@unional/logging'
import { MemoryAppender } from 'aurelia-logging-memory'
import assert from 'assert'
import { AssertOrder } from 'assertron'

import { baseline } from '.'

beforeEach(() => {
  setLevel(logLevel.none)
})

afterEach(() => {
  clearAppenders()
  setLevel(logLevel.none)
})

test('filter cases using RegExp', () => {
  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: /file1/
  }, ({ caseName }) => {
    assert.equal(caseName, 'file1.txt')
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
    assert.equal(caseName, 'file1.txt')
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
    assert.equal(caseName, 'file2.txt')
    o.once(1)
  })
  o.end()
})


test('log filtered case', () => {
  setLevel(logLevel.warn)
  const mem = new MemoryAppender()
  addAppender(mem)

  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: '!file1.txt'
  }, ({ caseName }) => {
    assert.equal(caseName, 'file2.txt')
    o.once(1)
  })

  assert.equal(mem.logs.length, 1)
  o.end()
})


test('suppressFilterWarning option will skip log filtered case', () => {
  setLevel(logLevel.warn)
  const mem = new MemoryAppender()
  addAppender(mem)

  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: '!file1.txt',
    suppressFilterWarning: true
  }, ({ caseName }) => {
    assert.equal(caseName, 'file2.txt')
    o.once(1)
  })

  assert.equal(mem.logs.length, 0)
  o.end()
})
