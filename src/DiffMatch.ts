import { diff_match_patch } from 'diff-match-patch'
import 'diff-match-patch-line-and-word'

export interface DiffResult {
  value: string;
  count?: number;
  added?: boolean;
  removed?: boolean;
}

export class DiffMatch extends diff_match_patch {
  diffLines(expected: string, actual: string) {
    return this.diff_lineMode(expected, actual).map(toJsDiffResult)
  }
  diffWords(expected: string, actual: string) {
    return this.diff_wordMode(expected, actual).map(toJsDiffResultForWord)
  }
}

function toJsDiffResult(diff) {
  const result = { value: diff[1] } as DiffResult
  switch (diff[0]) {
    case -1:
      result.removed = true
      break
    case 1:
      result.added = true
      break
  }
  result.count = (diff[1].match(/\n/g) || []).length || 1
  return result
}

function toJsDiffResultForWord(diff) {
  const result = { value: diff[1] } as DiffResult
  switch (diff[0]) {
    case -1:
      result.removed = true
      break
    case 1:
      result.added = true
      break
  }
  result.count = 1 + (diff[1].match(/[\s]/g) || []).length
  return result
}
