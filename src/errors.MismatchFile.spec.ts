import assert from 'assert'

import { MismatchFile } from '.'

test('single line file will diff by words', () => {
  const actual = (new MismatchFile('a', 'beep boop', 'b', 'beep boob blah')).tersify()
  assert.equal(actual.indexOf('+'), -1)
})

test('multiline file will diff by lines', () => {
  const actual = (new MismatchFile('a', 'beep\nboop', 'b', 'beep\nboob blah')).tersify()
  console.log(actual)
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

  console.log(actual)
})
