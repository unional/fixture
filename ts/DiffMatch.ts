import { diff_match_patch } from 'diff-match-patch'
import 'diff-match-patch-line-and-word'

export interface DiffResult {
  value: string,
  count?: number,
  added?: boolean,
  removed?: boolean
}

/**
 * `diff-match-patch-line-and-word` patches these two methods onto the
 * `diff_match_patch` prototype at runtime, and ships the matching types as a module
 * augmentation *inside its own package*. Under pnpm's strict, non-hoisted layout that
 * augmentation resolves `'diff-match-patch'` from its own directory — the untyped
 * runtime package, a different module identity than the `@types/diff-match-patch` this
 * repo sees — so it never merges and both calls below fail with TS2339. yarn's hoisting
 * made the two identities coincide by accident.
 *
 * `declare` is what makes this honest: it is a type-only assertion that the prototype
 * already carries these, so nothing is emitted and no field is initialised over them at
 * runtime. Merging an `interface DiffMatch` into the class would work too, but
 * `@typescript-eslint/no-unsafe-declaration-merging` rejects it — correctly, since that
 * form cannot distinguish "the prototype really has this" from "I wish it did".
 */
export class DiffMatch extends diff_match_patch {
  declare diff_lineMode: (text1: string, text2: string) => Array<[number, string]>
  declare diff_wordMode: (text1: string, text2: string) => Array<[number, string]>

  diffLines(expected: string, actual: string) {
    return this.diff_lineMode(expected, actual).map(toJsDiffResult)
  }
  diffWords(expected: string, actual: string) {
    return this.diff_wordMode(expected, actual).map(toJsDiffResultForWord)
  }
}

function toJsDiffResult(diff: [number, string]) {
  const result = { value: diff[1] } as DiffResult
  switch (diff[0]) {
    case -1:
      result.removed = true
      break
    case 1:
      result.added = true
      break
  }
  result.count = diff[1].match(/\n/g)!.length
  return result
}

function toJsDiffResultForWord(diff: [number, string]) {
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
