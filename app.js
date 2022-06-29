require('dotenv').config()
const express = require('express')
const session = require('express-session')
const path = require('path')
const app = express()

app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'))

app.use(express.urlencoded({extended:false}))
app.use(express.json())


const sessionConfig={
    secret: 'something crazy',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
}
app.use(session(sessionConfig))

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


const oktaAPI = require("./routes/okta")
const xeroAPI = require("./routes/xero")
const login = require("./routes/login")
const visual = require("./routes/visualize");
const dasboard = require("./routes/dashboard")

app.use("/", xeroAPI)
//app.use("/okta", oktaAPI)
app.use("/login", login)
app.use("/viz", visual)
app.use('/dasboard', dashboard)


app.listen(3000,()=>{
    console.log('Listening to port 3000')
})


