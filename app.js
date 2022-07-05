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
            req.session.username = decoded.username
            next()
        }
    })
}


//Routes
const login = require("./routes/login")
const okta = require("./routes/okta")
const xero = require("./routes/xero")
const subscription = require("./routes/subscription")
const employees = require('./routes/employee')
const visual = require("./routes/visualize")


app.use("/", login)
app.use("/okta", checkLogin, okta) //check here
app.use("/xero", xero)
app.use('/subscription', checkLogin, subscription)
app.use('/employee', checkLogin, employees)
app.use("/viz", checkLogin, visual)


const port=process.env.PORT || 3001
app.listen(port, () => console.log(`Listening on port ${port}...`));