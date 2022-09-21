require('dotenv').config()

const { auth, requiresAuth } = require('express-openid-connect')
const cookieParser = require('cookie-parser')
const sessions = require('express-session')
const mongoose = require('mongoose')
const passport = require('passport')
const express = require('express')
const path = require('path')
const cors = require('cors')
const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

const iam_config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'http://localhost:3000',
  clientID: 'I0gB3abCqH18QSXKyNPy40VWRPsWq9fn',
  issuerBaseURL: 'https://saasden1.us.auth0.com'
}

const sess_config = {
  secret: 'a long, randomly-generated string stored in env',
  saveUninitialized: true,
  resave: false,
  maxAge: 86400000 // 1 Day
}

const cors_config = {
  origin: ['http://127.0.0.1:3000', 'http://localhost:3000', 'https://login.xero.com'],
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}

app.use(express.urlencoded({ extended: false }))

app.use(sessions(sess_config))
app.use(cors(cors_config))
app.use(auth(iam_config)) // auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(cookieParser())
app.use(express.json())
app.use(passport.initialize())
app.use(passport.session())

const User = require('./models/user')
passport.use(User.createStrategy())

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (err) {
    console.log('Error Connecting to mongoDB')
  } else {
    console.log('MongoDB Connected')
  }
})

// Routes

// IAM Routes

// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out')
})

app.get('/profile', requiresAuth(), (req, res) => {
  console.log(req.session)
  res.send(JSON.stringify(req.oidc.user))
})

// SSO Routes
const okta = require('./routes/SSO/Okta_route')
const azure = require('./routes/SSO/Azure_route')
const pingone = require('./routes/SSO/PingOne_route')
const onelogin = require('./routes/SSO/OneLogin_route')
const jumpcloud = require('./routes/SSO/JumpCloud_route')

app.use('/api/v1/okta', okta)
app.use('/api/v1/azure', azure)
app.use('/api/v1/pingone', pingone)
app.use('/api/v1/onelogin', onelogin)
app.use('/api/v1/jumpcloud', jumpcloud)

// EMS Routes
const xero = require('./routes/EMS/Xero_route')
const zoho = require('./routes/EMS/Zoho_route')
const expensify = require('./routes/EMS/Expensify_route')

app.use('/api/v1/xero', xero)
app.use('/api/v1/zoho', zoho)
app.use('/api/v1/expensify', expensify)

// Dashboard Routes
const login = require('./routes/dashboard/login')
const subs = require('./routes/dashboard/subscription')
const emps = require('./routes/dashboard/employee')
// const visual = require('./routes/dashboard/visualize')

app.use('/api/v1', login)
app.use('/api/v1', subs)
app.use('/api/v1', emps)
// app.use('/api/v1/viz', visual)

// Test Route
app.get('/test', (req, res) => {
  res.send('Test Route, backend is working')
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Listening on port ${port}...`))
