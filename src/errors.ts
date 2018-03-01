import { Tersify } from 'tersify'

export class NoCaseFound extends Error {
  constructor(public dir: string) {
    super(`No test cases found in '${dir}'`)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class MismatchFile {
  constructor(public actualPath, public actual, public expectedPath, public expected) { }
  tersify() {
    return `File '${this.actualPath}' does not match with '${this.expectedPath}'.\n'${this.actual}' != '${this.expected}'`
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
