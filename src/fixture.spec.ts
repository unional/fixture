import assert from 'assert'

import { fixture, NoCaseFound } from '.'

test('load from not exist folder throws NoCaseFound', () => {
  assert.throws(() => fixture('fixtures/not-exist', () => {
    throw new Error('should not called')
  }), err => err instanceof NoCaseFound && err.dir === 'fixtures/not-exist')
})

test('load from folder without "cases" subfolder throws NoCaseFound', () => {
  assert.throws(() => fixture('fixtures/no-cases', () => {
    throw new Error('should not called')
  }), err => err instanceof NoCaseFound && err.dir === 'fixtures/no-cases/cases')
})

test('load from empty folder throws NoCaseFound', () => {
  expect(() => fixture('fixtures/empty', () => {
    throw new Error('should not called')
  })).toThrowError(NoCaseFound)
})
