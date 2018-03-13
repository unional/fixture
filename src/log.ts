import { getLogger, Logger, setDefaultAppender, setLevel, logLevel } from '@unional/logging'
import { ColorAppender } from 'aurelia-logging-color'

const log: Logger = getLogger('fixture')

setLevel(logLevel.warn)
setDefaultAppender(new ColorAppender())

export { log }
