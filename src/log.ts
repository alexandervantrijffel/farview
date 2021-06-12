import winston, { format, transports } from 'winston'
import { envString } from './env'

const logFormat = format.printf((info) => {
  return `${info.timestamp} ${info.level}: ${info.message} ${
    info.metadata && Object.keys(info.metadata).length > 0 ? JSON.stringify(info.metadata) : ''
  } `
})

const logger = winston.createLogger({
  level: envString('NODE_ENV') === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), logFormat)
    })
  ],
  exitOnError: false
})

export default logger
