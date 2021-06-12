import { Request, Response } from 'express'
import express from 'express'
import { envString } from './env'
import { google } from 'googleapis'

import axios, { AxiosResponse } from 'axios'
import log from './log'
import jwt from 'jsonwebtoken'

const router = express.Router()
const redirectURI = 'google/callback'
import querystring from 'querystring'

const oauth2Client = new google.auth.OAuth2(
  envString('GOOGLE_CLIENT_ID'),
  envString('GOOGLE_CLIENT_SECRET'),
  `${envString('SERVER_ROOT_URI')}/auth/${redirectURI}`
)

function getGoogleAuthURL() {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
  const options = {
    redirect_uri: `${envString('SERVER_ROOT_URI')}/auth/${redirectURI}`,
    client_id: envString('GOOGLE_CLIENT_ID'),
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/photoslibrary',
      'https://www.googleapis.com/auth/photoslibrary.appendonly',
      'https://www.googleapis.com/auth/photoslibrary.edit.appcreateddata',
      'https://www.googleapis.com/auth/photoslibrary.sharing'
    ].join(' ')
  }

  return `${rootUrl}?${querystring.stringify(options)}`
}

router.get('/', (_req, res) => {
  res.send('auth root')
})

router.get('/login', (_req, res) => {
  res.redirect(getGoogleAuthURL())
})

router.get(`/${redirectURI}`, async (req: Request, res: Response): Promise<void> => {
  const token = await getSignedGoogleUser(String(req.query.code))
  res.cookie('google_token', token, {
    maxAge: 900000,
    httpOnly: true,
    secure: false
  })

  res.redirect(envString('SERVER_ROOT_URI'))
})

async function getSignedGoogleUser(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  log.debug('got access_token', { access_token: tokens.access_token })

  // console.log(
  //   'verifying id token',
  //   await oauth2Client.verifyIdToken({
  //     idToken: String(tokens.id_token)
  //   })
  // )

  // Fetch the user's profile with the access token and bearer
  const googleUser = await axios
    .get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`, {
      headers: {
        Authorization: `Bearer ${tokens.id_token}`
      }
    })
    .then((res: AxiosResponse) => res.data)
    .catch((error) => {
      throw new Error(error.message)
    })

  return jwt.sign(googleUser, envString('JWT_SECRET'))
}

// Getting the current user
router.get('/me', (req, res) => {
  try {
    const decoded = jwt.verify(req.cookies['google_token'], envString('JWT_SECRET'))
    return res.send(decoded)
  } catch (err) {
    log.debug('/me failed:', err)
    res.status(500)
    res.send('Operation failed')
  }
})

export default router
