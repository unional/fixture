import { createStandardLog, Logger } from 'standard-log'

let log: Logger | undefined

export const context: { log: Logger } = {
  get log() {
    if (log) return log
    const sl = createStandardLog()
    return log = sl.getLogger('standard-log')
  },
  set log(logger) {
    log = logger
  }
}
