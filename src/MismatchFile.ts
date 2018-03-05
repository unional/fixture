import * as jsdiff from 'diff'

import { createDiff, formatDiff, DiffFormatOptions } from './diff'

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
