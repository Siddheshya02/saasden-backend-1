const express = require('express')
const session = require('express-session')
const path = require('path')
const app = express()


app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'))

app.use(express.static(path.join(__dirname,'public')))
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


app.use("/xero", xeroAPI)
app.use("/okta", oktaAPI)


app.get("/home", (req, res)=>{
    res.sendFile(__dirname+ "/public/home/home.html")
})

app.listen(3000,()=>{
    console.log('Listening to port 3000')
})


