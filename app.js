const express = require('express')
const session = require('express-session')
const path = require('path')
const app = express()


app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'))

app.use(express.urlencoded({extended:true}))
app.use(express.json())


const sessionConfig={
    secret: 'something crazy',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
}
app.use(session(sessionConfig))


const oktaAPI = require("./routes/okta")
const xeroAPI = require("./routes/xero")
const login = require("./routes/login")
const visual = require("./routes/visualize")


app.use("/", xeroAPI)
app.use("/okta", oktaAPI)
app.use("/login", login)
app.use("/viz", visual)


app.listen(3000,()=>{
    console.log('Listening to port 3000')
})


