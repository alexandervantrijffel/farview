import { Request, Response, NextFunction } from 'express'
import log from '../log'

export class HttpException extends Error {
  statusCode: number
  message: string
  error: string | null

  constructor(statusCode: number, message: string, error?: string) {
    super(message)

    this.statusCode = statusCode
    this.message = message
    this.error = error || null
  }
}

export const httpExceptionHandler = (
  err: HttpException,
  req: Request,
  response: Response,
  next: NextFunction
): void => {
  if (!err) {
    return next()
  }
  const status = err.statusCode || 500
  let message = err.message || "This didn't go well, an unexpected error occurred"
  if (err.error) message += ' -- ' + err.error

  log.error(`Unhandled ${err.stack}`, {
    request: {
      method: req.method,
      url: req.originalUrl,
      route: req.route.path,
      query: req.query,
      params: req.params,
      host: req.hostname
    }
  })

  response.status(status).send(message)
}

export const errorHandler = (err: Error, req: Request, response: Response, next: NextFunction): void => {
  console.log('ERRORHANDLER', err)
  if (!err) {
    return next()
  }
  const status = 500 // err.statusCode || 500
  const message = JSON.stringify(err) || "This didn't go well, an unexpected error occurred"

  log.error(`Unhandled ${err.stack}`, {
    request: {
      method: req.method,
      url: req.originalUrl,
      route: req.route.path,
      query: req.query,
      params: req.params,
      host: req.hostname
    }
  })

  response.status(status).send(message)
}

export const notFoundHandler = (request: Request, response: Response): void => {
  log.info(`404 for url ${request.originalUrl}`)
  response.status(404).send(`Resource [${request.originalUrl}] not found`)
}
