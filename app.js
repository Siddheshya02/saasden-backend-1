require('dotenv').config()

const sessions = require('express-session')
const cookieParser = require("cookie-parser")
const express = require('express')
const path = require('path')
const cors = require("cors")
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
app.use(cors())


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
    if(req.cookies.isLoggedin)
        next()
    else
        res.redirect('https://example.com') // redirect to the frontend login page
}


//Routes
const login = require("./routes/login")
const okta = require("./routes/okta")
const xero = require("./routes/xero")
const subscription = require("./routes/subscription")
const employees = require('./routes/employee')
const visual = require("./routes/visualize");

app.use("/", login)
app.use("/okta", checkLogin, okta)
app.use("/xero", checkLogin, xero)
app.use('/subscription', checkLogin, subscription)
app.use('/employee', checkLogin, employees)
app.use("/viz", checkLogin, visual)


app.get("/cookies",(req, res)=>{
    res.send(req.cookies)
})

app.listen(3000,()=>{
    console.log('Listening to port 3000')
})


