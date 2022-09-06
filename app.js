require('dotenv').config()

const cookieParser = require('cookie-parser')
const sessions = require('express-session')
const express = require('express')
const path = require('path')
const cors = require('cors')
const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(sessions({
  secret: 'HighlysecretSauce',
  saveUninitialized: true,
  resave: false
}))
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors({
  origin: ['http://127.0.0.1:3000', 'http://localhost:3000', 'https://login.xero.com'],
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}))

// mongoose passport crap
const mongoose = require('mongoose')
const passport = require('passport')

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
  if (err) { console.log('Error Connecting to mongoDB') } else { console.log('MongoDB Connected') }
})

function checkLogin (req, res, next) {
  if (req.cookies.username && req.cookies.saasdenID) {
    next()
  } else {
    res.sendStatus(403)
  }
}
// Routes

// SSO Routes
const okta = require('./routes/SSO/Okta_route')
const azure = require('./routes/SSO/Azure_route')
const pingone = require('./routes/SSO/PingOne_route')
const onelogin = require('./routes/SSO/OneLogin_route')
const jumpcloud = require('./routes/SSO/JumpCloud_route')

app.use('/api/v1/okta', checkLogin, okta)
app.use('/api/v1/azure', checkLogin, azure)
app.use('/api/v1/pingone', checkLogin, pingone)
app.use('/api/v1/onelogin', checkLogin, onelogin)
app.use('/api/v1/jumpcloud', checkLogin, jumpcloud)

// EMS Routes
const xero = require('./routes/EMS/Xero_route')
const zoho = require('./routes/EMS/Zoho_route')
const expensify = require('./routes/EMS/Expensify_route')

app.use('/api/v1/xero', checkLogin, xero)
app.use('/api/v1/zoho', checkLogin, zoho)
app.use('/api/v1/expensify', checkLogin, expensify)

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

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`Listening on port ${port}...`))
