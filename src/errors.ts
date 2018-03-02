import chalk from 'chalk'
import * as jsdiff from 'diff'
import { Tersify } from 'tersify'

export class NoCaseFound extends Error {
  constructor(public dir: string) {
    super(`No test cases found in '${dir}'`)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class MismatchFile {
  constructor(public actualPath: string, public actual: string, public expectedPath: string, public expected: string) { }
  tersify() {
    const formattedDiff = this.formatDiff()
    return `File '${this.actualPath}' does not match with '${this.expectedPath}'.\n\n${formattedDiff}`
  }
  private formatDiff() {
    return this.actual.indexOf('\n') === -1 && this.expected.indexOf('\n') === -1 ? this.formatWordsDiff() : this.formatLinesDiff()
  }
  private formatWordsDiff() {
    return jsdiff.diffWords(this.actual, this.expected)
      .map(function (part) {
        if (part.added)
          return chalk.green(part.value)
        else if (part.removed)
          return chalk.red(part.value)
        else
          return part.value
      }).join('')
  }
  private formatLinesDiff() {
    return jsdiff.diffLines(this.actual, this.expected)
      .map(function (part) {
        const value = part.value.replace(/(\r\n|\n|\r)/gm, '')
        if (part.added)
          return chalk.green(`+ ${value}`)
        else if (part.removed)
          return chalk.red(`- ${value}`)
        else
          return value
      }).join('\n')
  }
}

export class MissingFile {
  constructor(public filePath: string) { }
  tersify() {
    return `Missing file '${this.filePath}'`
  }
}

export class MissingDirectory {
  constructor(public dirPath: string) { }
  tersify() {
    return `Missing directory '${this.dirPath}'`
  }
}

export class Mismatch extends Error {
  constructor(public mismatches: Tersify[]) {
    super(`Mismatch detected:\n${mismatches.map(m => m.tersify()).join('\n')}`)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
