require('dotenv').config()
const cors = require("cors")
const sessions = require('express-session')
const cookieParser = require("cookie-parser")
const express = require('express')
const path = require('path')
const jwt = require("jsonwebtoken")
const app = express()

app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'))

app.use(sessions({
    secret: "HighlysecretSauce",
    saveUninitialized: true,
    resave : false
}))
app.use(cookieParser())
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(cors({
    origin: ["http://127.0.0.1:3000", "http://localhost:3000", "https://login.xero.com"],
    methods: ["GET", "POST", "DELETE"],
    credentials: true
}))

//mongoose passport crap
const mongoose = require('mongoose');
const passport = require('passport');

app.use(passport.initialize());
app.use(passport.session());

const User = require('./models/user');
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect(process.env.MONGODB_URI,{ 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}, (err) => {
    if (err) 
        console.log('Error Connecting to mongoDB');
    else
        console.log('MongoDB Connected')
});

//Middleware for route security, very basic, need to secure it
function checkLogin(req, res, next){
    jwt.verify(req.headers.token, process.env.secretKey,(err, decoded)=>{
        if(err)
            res.sendStatus(401)
        else{
            if(!req.cookies.oktaAPIKey){ //check for validity of oktaKeys
                res.json({url: 'http://localhost:3000/login-sso'})//redirect to okta API key page
            }
            else if(!req.cookies.xero_access_token){ // check for validity of xero keys
                if(req.session.xero_access_token)
                    res.status(69).json({url: 'http://localhost:3001/xero/refreshXeroToken'})//redirect to refresh token route
                else
                    res.status(420).json({url: 'http://localhost:3000/login-exp'})//redirect to exp login
            }
            else{
                next()       
                req.session.username = decoded.username
                req.session.xero_access_token = req.cookies.xero_access_token
            }
        }
    })
}

//Routes

//SSO Routes
const okta = require("./routes/SSO/okta")
const azure = require("./routes/SSO/azure")
const ping = require("./routes/SSO/ping")

//EMS Routes
const xero = require("./routes/EMS/xero")
const expensify = require("./routes/EMS/expensify")

//Dashboard Routes
const login = require("./routes/dashboard/login")
const subscription = require("./routes/dashboard/subscription")
const employees = require('./routes/dashboard/employee')
const visual = require("./routes/dashboard/visualize")


app.use("/api/v1", login)
app.use('/api/v1/subscription', checkLogin, subscription)
app.use('/api/v1/employee', checkLogin, employees)
app.use("/api/v1/viz", checkLogin, visual)

app.use("/api/v1/okta", okta) //check here
app.use("/api/v1/azure",azure)
app.use("/api/v1/ping", ping)

app.use("/api/v1/xero", xero)
app.use("/api/v1/expensify", expensify)


//Test Route
app.get("/test",(req, res)=>{
    res.send("Test Route, backend is working")
})

const port=process.env.PORT || 3001
app.listen(port, () => console.log(`Listening on port ${port}...`));