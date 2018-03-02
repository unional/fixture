import assert from 'assert'

import { MismatchFile } from '.'

test('single line file will diff by words', () => {
  const actual = (new MismatchFile('a', 'beep boop', 'b', 'beep boob blah')).tersify()
  assert.equal(actual.indexOf('+'), -1)
})

test('multiline file will diff by words', () => {
  const actual = (new MismatchFile('a', 'beep\nboop', 'b', 'beep\nboob blah')).tersify()
  assert(actual.indexOf('+') > 0)
})
