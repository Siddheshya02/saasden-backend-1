import { checkStatus, handleErrors, setOrgName } from './middleware/middleware.js'

import { router as azure } from './routes/SSO/Azure_route.js'
import connectRedis from 'connect-redis'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { createClient } from 'redis'
import dotenv from 'dotenv'
import { router as emps } from './routes/dashboard/employee_route.js'
import express from 'express'
import { expressjwt } from 'express-jwt'
import { router as jumpcloud } from './routes/SSO/JumpCloud_route.js'
import jwks from 'jwks-rsa'
import mongoose from 'mongoose'
import { router as okta } from './routes/SSO/Okta_route.js'
import { router as onelogin } from './routes/SSO/OneLogin_route.js'
import { router as pingone } from './routes/SSO/PingOne_route.js'
import { router as refresh } from './routes/dashboard/refresh_route.js'
import sessions from 'express-session'
import { router as subs } from './routes/dashboard/subscription_route.js'
import { router as xero } from './routes/EMS/Xero_route.js'
import { router as zoho } from './routes/EMS/Zoho_route.js'

dotenv.config()

const RedisStore = connectRedis(sessions)
const redisClient = createClient({ legacyMode: true })
const app = express()

// Verify the Auth0 Token
const jwtCheck = expressjwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://saasden1.us.auth0.com/.well-known/jwks.json'
  }),
  audience: 'https://www.saasden.club',
  issuer: 'https://saasden1.us.auth0.com/',
  algorithms: ['RS256']
})

// Session Configuration, uses redis, need redis to run in local environment
const sess_config = {
  secret: process.env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // Note that the cookie-parser module is no longer needed
  store: new RedisStore({
    host: process.env.REDIS_URI,
    port: process.env.REDIS_PORT,
    client: redisClient
  })
}

// The most troublesome part, always check before deployment
const cors_config = {
  origin: ['https://login.xero.com', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://saasden.club'],
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}

// Redis server connection
redisClient.connect()
  .then(() => console.log('Redis Connected'))
  .catch((err) => {
    console.log('Error connecting to redis')
    console.log(err)
  })

// MongoDB configuration
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (err) {
    console.log('Error Connecting to mongoDB')
    console.log(err)
  } else {
    console.log('MongoDB Connected')
  }
})

// Middleware, order of middlewares is important check
app.use(express.urlencoded({ extended: false }))
app.use(sessions(sess_config))
app.use(cors(cors_config))
app.use(cookieParser())
app.use(express.json())
// app.use(jwtCheck) // check token first
// app.use(handleErrors) // throw errors if error found in the token
// app.use(setOrgName) // set the organization id in the session

// SSO Routes
app.use('/api/v1/okta', okta)
app.use('/api/v1/azure', azure)
app.use('/api/v1/pingone', pingone)
app.use('/api/v1/onelogin', onelogin)
app.use('/api/v1/jumpcloud', jumpcloud)

// EMS Routes
app.use('/api/v1/xero', xero)
app.use('/api/v1/zoho', zoho)

// Dashboard Routes
app.use('/api/v1/refresh', refresh) // add checkStatus afterwards
app.use('/api/v1/subs', subs) // add checkStatus afterwards
app.use('/api/v1/emps', emps) // add checkStatus afterwards

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Listening on port ${port}...`))
