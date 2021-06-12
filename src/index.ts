import dotenv from 'dotenv'
dotenv.config()

import Server from './server'
const server: Server = new Server()
import { envString, envInt } from './env'
import log from './log'
;(async () => {
  const appId: string = envString('LOGROCKET_APPID', '')
  log.info('Starting 🚀')
  const port = envInt('PORT', 3000)
  server
    .start(port)
    .then(() => log.info(`⚡️ server started on http://localhost:${port}`, { logRocketAppId: appId }))
    .catch((err: unknown) => log.error('Server failed with error ', err))
})()

import photos from './googlePhotos'
photos()
