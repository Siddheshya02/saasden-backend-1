const passport = require('passport')
const userModel = require('../models/user')
const router = require('express').Router()
const {Issuer}=require('openid-client')
const axios = require('axios')
const mapping = require('../JS/mapping')


const client_id =process.env.CLIENT_ID;
const client_secret =process.env.CLIENT_SECRET;
const redirectUrl =process.env.REDIRECT_URL
const scopes =process.env.SCOPES;
var client




router.post("/signup",(req, res, next)=>{
    userModel.register({
        name: req.body.name,
        companyName: req.body.companyName,
        workEmail: req.body.workEmail,
        userName: req.body.userName,
    }, req.body.password, (err)=>{
        if(err){
            console.log("Error in Signup")
            return next(err)
        }
    })
    res.sendStatus(200)
})


router.post("/login", passport.authenticate('local', {failureRedirect: '/login'}) ,(req, res)=>{ 
    console.log(request.body)
    res.sendStatus(200)
})


router.post("/okta", async(req, res) => {
    try {
        await userModel.findOneAndUpdate(
            {userName : req.session.userName},
            {
                oktaDomain: req.body.oktaDomain,
                oktaAPIKey: req.body.oktaAPIKey
            },
            {new: true }
        )
        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})


router.get("/xero", (req, res) => {
    Issuer
    .discover('https://identity.xero.com/')
    .then((issuer)=>{
        client=new issuer.Client({
            client_id:client_id,
            client_secret:client_secret
        })
    })
    .then(() => {
        let consentUrl = client.authorizationUrl({
            redirect_uri: redirectUrl,
            scope: scopes,
        }); 
        res.send(`Sign in and connect with Xero using OAuth2! <br><a href="${consentUrl}">Connect to Xero</a>`)
    })
    .catch( (e) => {
        console.log(e)
        res.sendStatus(500)
    })
})


router.get("/callback", async(req,res)=>{
    try{
        Issuer.defaultHttpOptions = {timeout: 20000};
        client.CLOCK_TOLERANCE=5
        const token = await client.callback(redirectUrl, req.query)
        req.session.accessToken=token.accessToken
        let accessToken = token.access_token
        let refreshToken = token.refresh_token    
        let idToken = token.id_token

                    
        const options_Xero = {
            url: "https://api.xero.com/connections",
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken,
                'Timeout': 10000
            }            
        }
  
        console.log(options_Xero)
        let output = await axios.request(options_Xero)
        let tenantID = []
        output.data.forEach(tenant => {
            tenantID.push(tenant.tenantId)
        });
        req.session.tenantID=tenantID //figure out session storage issues here
        await mapping.appDB(accessToken, tenantID[0])
        res.sendStatus(200)
    } catch(error){
        console.log(error)
        res.sendStatus(500)
    }
})


router.get("/logout", (req,res)=>{
    req.session.destroy()
    res.sendStatus(200)
})

module.exports = router;