import assert from 'assert'

import { MismatchFile } from '.'

test('single line file will diff by words', () => {
  const actual = (new MismatchFile('a', 'beep boop', 'b', 'beep boob blah')).tersify()
  assert.equal(actual.indexOf('+'), -1)
})

test('multiline file will diff by lines', () => {
  const actual = (new MismatchFile('a', 'beep\nboop', 'b', 'beep\nboob blah')).tersify()
  console.info(actual)
  assert(actual.indexOf('+') > 0)
})

test('multilines are aligned', () => {
  const a = `
a
  b
    c
  d
`
  const b = `
a
  b
    d
  e
`
  const actual = (new MismatchFile('a', a, 'b', b)).tersify()
  console.info(actual)
  actual.split('\n').filter(a => a).map(a => a.slice(0, 2)).every(a => a === '  ' || a === 'u001b[31m- ' || a === '\u001b[31m\u001b[39m\u001b[32m+ ')
})

test('multilines (missing) are aligned', () => {
  const a = `
a
  b
  c
  d
`
  const b = `
a
  b
`
  const actual = (new MismatchFile('a', a, 'b', b)).tersify()
  console.info(actual)
  actual.split('\n').filter(a => a).map(a => a.slice(0, 2)).every(a => a === '  ' || a === 'u001b[31m- ' || a === '\u001b[31m\u001b[39m\u001b[32m+ ')
})

test('multilines (added) are aligned', () => {
  const a = `
a
  b
`
  const b = `
a
  b
  c
  d
`
  const actual = (new MismatchFile('a', a, 'b', b)).tersify()
  console.info(actual)
  actual.split('\n').filter(a => a).map(a => a.slice(0, 2)).every(a => a === '  ' || a === 'u001b[31m- ' || a === '\u001b[31m\u001b[39m\u001b[32m+ ')
})
