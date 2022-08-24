import assert from 'assert'
import { pathEqual } from 'path-equal'

import { baseline, NoCaseFound } from './index.js'

test('load from not exist folder throws NoCaseFound', () => {
  assert.throws(() => baseline('fixtures/not-exist', () => {
    throw new Error('should not called')
  }), (err: Error) => err instanceof NoCaseFound && pathEqual(err.dir, 'fixtures/not-exist'))
})

test('load from folder without "cases" subfolder throws NoCaseFound', () => {
  assert.throws(() => baseline('fixtures/no-cases', () => {
    throw new Error('should not called')
  }), (err: Error) => err instanceof NoCaseFound && pathEqual(err.dir, 'fixtures/no-cases/cases'))
})

test('load from empty folder throws NoCaseFound', () => {
  assert.throws(() => baseline('fixtures/empty', () => {
    throw new Error('should not called')
  }), (err: Error) => err instanceof NoCaseFound && pathEqual(err.dir, 'fixtures/empty/cases'))
})
