import { getLogger, Logger, logLevels } from 'standard-log'

const log: Logger = getLogger('fixture', { level: logLevels.warn })

export { log }
