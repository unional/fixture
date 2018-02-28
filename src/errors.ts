export class NoCaseFound extends Error {
  constructor(public dir: string) {
    super(`No test cases found in '${dir}'`)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
