import express, { Request, Response, Express, NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import http from 'http'
import helmet from 'helmet'
import cors from 'cors'
import { errorHandler, httpExceptionHandler, notFoundHandler, HttpException } from './error'
import log from './log'
import { envString } from './env'

//"passport": "^0.4.1",
//"@types/passport": "^1.0.6",
//"@types/passport-google-oauth20": "^2.0.8",
//"passport-google-oauth20": "^2.0.0",
// import passport from 'passport'
// import configurePassport from './configurePassport'
// configurePassport(passport)

import session from 'express-session'
import fileStore from 'session-file-store'
//import authRoutes from './auth/routes'
// import { ensureAuth, ensureGuest } from './auth/middleware'
import googleAuthRoutes from './googleAuth'

export default class Server {
  private app: Express
  private server: http.Server

  constructor() {
    this.setupApp()
  }

  public start = (port?: number): Promise<Express> => {
    return new Promise<Express>((resolve, reject) => {
      if (port) this.server = this.app.listen(port)
      else this.server = this.app.listen()
      this.server
        .on('listening', () => {
          resolve(this.app)
        })
        .on('error', (err: unknown) => reject(err))
      process.on('SIGTERM', this.shutdown)
      process.on('SIGINT', this.shutdown)
    })
  }
  private setupApp = () => {
    this.app = express()
    this.app.use(cookieParser())
    this.app.use(helmet())
    this.app.use(
      cors({
        // Sets Access-Control-Allow-Origin to the UI URI
        origin: envString('SERVER_ROOT_URI'),
        // Sets Access-Control-Allow-Credentials to true
        credentials: true
      })
    )
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(express.json({ limit: '1mb' })) // 100kb default
    this.app.use(express.static('public'))
    this.app.set('view engine', 'ejs')
    const FileStore = fileStore(session)
    this.app.use(
      session({
        secret: 'ZTNiMGM0NDI5OGZjMWMxNDlh',
        resave: false,
        saveUninitialized: false,
        store: new FileStore({ logFn: log.debug })
      })
    )
    // Passport middleware
    // this.app.use(passport.initialize())
    // this.app.use(passport.session())
    this.setupRoutes()
    this.app.use(httpExceptionHandler)
    this.app.use(errorHandler)
    this.app.use(notFoundHandler)
  }
  private setupRoutes = () => {
    this.app.use('/auth', googleAuthRoutes)
    this.app.get('/log', async (req: Request, res: Response): Promise<void> => {
      log.debug('log request', req)
      res.render('index', { session: req.session })
    })
    this.app.get('/', (_: Request, res: Response) => {
      //this.app.get('/', ensureGuest, (_: Request, res: Response) => {
      res.send(`[${envString('NODE_ENV')}] Hello`)
    })
    this.app.get('/fail', async (_: Request, _2: Response, next: NextFunction) => {
      //this.app.get('/fail', ensureGuest, async (_: Request, _2: Response, next: NextFunction) => {
      next()
      await (async (): Promise<void> => {
        throw new HttpException(400, 'I think not', 'additional error info')
      })().catch((err: unknown) => next(err))
    })
    // log.debug(`registered routes ${JSON.stringify(this.app._router.stack)}`)
    // log.debug(`registered routes`, this.app._router.stack)
    // log.debug(
    //   'registered routes',
    //   this.app._router.stack.map((r) => r.route?.path)
    // )
  }
  private shutdown = async () => {
    log.info('Shutting down app')
    this.server.close(() => {
      log.info('Exitting process')
      process.exit(0)
    })
    await new Promise((r) => setTimeout(r, 8000))
    log.info('Killing app because it dit not gracefully shutdown within the timeout')
    process.exit(1)
  }
}
