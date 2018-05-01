import { getLogger, Logger, setDefaultAppender, logLevel } from '@unional/logging'
import { ColorAppender } from 'aurelia-logging-color'

const log: Logger = getLogger('fixture', logLevel.warn)

setDefaultAppender(new ColorAppender())

export { log }
