import winston, { format, transports } from 'winston'
import { envString } from './env'
import colorize from 'json-colorizer'

const logFormat = format.printf((info) => {
  return `${info.timestamp} ${info.level}: ${info.message} ${
    info.metadata && Object.keys(info.metadata).length > 0 ? colorize(JSON.stringify(info.metadata, null, 2)) : ''
  } `
})

const logger = winston.createLogger({
  level: envString('NODE_ENV') === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    winston.format.colorize()
  ),
  transports: [
    new transports.Console({
      format: format.combine(logFormat)
    })
  ],
  exitOnError: false
})

export default logger
