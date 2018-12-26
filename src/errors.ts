import jsdiff from 'diff';
import { Tersify } from 'tersify';
import { createDiff, DiffFormatOptions, formatDiff } from './diff';
import { log } from './log';

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
    const time = new Date().getTime()
    const diff = createDiff(result, '')
    const createDiffTime = new Date().getTime()
    log.debug(`create diff for ${filePath} took ${createDiffTime - time} ms`)
    this.diff = diff.diff
    this.formattedDiff = formatDiff(diff, options)
    log.debug(`format diff for ${filePath} took ${new Date().getTime() - createDiffTime} ms`)
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

export class MismatchFile {
  diff: jsdiff.IDiffResult[]
  formattedDiff: string
  constructor(public actualPath: string, public actual: string, public expectedPath: string, public expected: string, options: DiffFormatOptions) {
    const diff = createDiff(actual, expected)
    this.diff = diff.diff
    this.formattedDiff = formatDiff(diff, options)
  }
  tersify() {
    return `File '${this.actualPath}' does not match with '${this.expectedPath}'.\n\n${this.formattedDiff}`
  }
}
