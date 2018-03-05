import * as jsdiff from 'diff'

import { DiffFormatOptions, createDiff, formatDiff } from './diff'

export class MissingResultFile {
  diff: jsdiff.IDiffResult[]
  formattedDiff: string
  constructor(public resultFilePath: string, baseline: string, options: DiffFormatOptions) {
    const diff = createDiff('', baseline)
    this.diff = diff.diff
    this.formattedDiff = formatDiff(diff, options)
  }
  tersify() {
    return `Missing result file '${this.resultFilePath}'.\n\n${this.formattedDiff}`
  }
}
