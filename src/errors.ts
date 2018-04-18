import * as jsdiff from 'diff'
import { Tersify } from 'tersify'

import { DiffFormatOptions, createDiff, formatDiff } from './diff'

export * from './MismatchFile'

export class NoCaseFound extends Error {
  constructor(public dir: string) {
    super(`No test cases found in '${dir}'`)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class MissingResultFile {
  diff: jsdiff.IDiffResult[]
  formattedDiff: string
  constructor(public filePath: string, baseline: string, options: DiffFormatOptions) {
    const diff = createDiff('', baseline)
    this.diff = diff.diff
    this.formattedDiff = formatDiff(diff, options)
  }
  tersify() {
    return `Missing result file '${this.filePath}'.\n\n${this.formattedDiff}`
  }
}

export class ExtraResultFile {
  diff: jsdiff.IDiffResult[]
  formattedDiff: string
  constructor(public filePath: string, result: string, options: DiffFormatOptions) {
    const diff = createDiff(result, '')
    this.diff = diff.diff
    this.formattedDiff = formatDiff(diff, options)
  }
  tersify() {
    return `Extra result file '${this.filePath}'.\n\n${this.formattedDiff}`
  }
}

export class Mismatch extends Error {
  constructor(public mismatches: Array<Tersify>) {
    super(`Mismatch detected: \n${mismatches.map(m => m.tersify()).join('\n')} `)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
