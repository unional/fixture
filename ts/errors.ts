import { IsoError } from 'iso-error'
import { Tersible } from 'tersify'
import { context } from './context.js'
import { createDiff, DiffFormatOptions, formatDiff } from './diff.js'
import { DiffResult } from './DiffMatch.js'

export class NoCaseFound extends IsoError {
  constructor(public dir: string, options?: IsoError.Options) {
    super(`No test cases found in '${dir}'`, options)
  }
}

export class NotCommandCase extends IsoError {
  constructor(public caseName: string, options?: IsoError.Options) {
    super(`The case '${caseName}' is not a supported command case`, options)
  }
}

export class MissingResultFile {
  diff: DiffResult[]
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
  diff: DiffResult[]
  formattedDiff: string
  constructor(public filePath: string, result: string, options: DiffFormatOptions) {
    const time = new Date().getTime()
    const diff = createDiff(result, '')
    const createDiffTime = new Date().getTime()
    context.log.debug(`create diff for ${filePath} took ${createDiffTime - time} ms`)
    this.diff = diff.diff
    this.formattedDiff = formatDiff(diff, options)
    context.log.debug(`format diff for ${filePath} took ${new Date().getTime() - createDiffTime} ms`)
  }
  tersify() {
    return `Extra result file '${this.filePath}'.\n\n${this.formattedDiff}`
  }
}

export class Mismatch extends IsoError {
  constructor(public mismatches: Array<Tersible<Record<string, any>>>, options?: IsoError.Options) {
    super(`Mismatch detected: \n${mismatches.map(m => m.tersify()).join('\n')} `, options)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class MismatchFile {
  diff: DiffResult[]
  formattedDiff: string
  constructor(public actualPath: string, public actual: string, public expectedPath: string, public expected: string, options: DiffFormatOptions) {
    const diff = createDiff(actual, expected)
    this.diff = diff.diff
    this.formattedDiff = formatDiff(diff, options)
  }
  tersify() {
    return `File '${this.actualPath}' does not match with '${this.expectedPath}'.\n\n${this.formattedDiff}
    diff:
    ${this.diff.map(d => JSON.stringify(d)).join('\n\n')}`
  }
}
