const passport = require('passport')
const userModel = require('../models/user')
const router = require('express').Router()
const {Issuer}=require('openid-client')
const axios = require('axios')
const mapping = require('../JS/mapping')
const { request } = require('express')
const { format } = require('path')


const client_id =process.env.CLIENT_ID;
const client_secret =process.env.CLIENT_SECRET;
const redirectUrl =process.env.REDIRECT_URL
const scopes =process.env.SCOPES;
var client

router.post("/signup",(req, res, next)=>{
    console.log(req.body)
    userModel.register({
        username: req.body.username,
        name: req.body.name,
        companyName: req.body.companyName,
        workEmail: req.body.workEmail,
    }, req.body.password, (err)=>{
        if(err){
            console.log("Error in Signup")
            res.sendStatus(500)
            return next(err)
        } else {
            res.sendStatus(200)
        }
    })
})


router.post("/login", passport.authenticate('local', {failureRedirect: ''}) ,(req, res)=>{ //put login route of frontend here 
    res.session.username = req.body.username
    res.cookie('isLoggedin', 'true', {expires: 180000 + Date.now()})
    res.cookie('username', req.body.username, {expires: 180000 + Date.now()})
    res.sendStatus(200)
})


router.post("/okta", async(req, res) => {
    try {
        await userModel.findOneAndUpdate(
            {userName : req.cookie['username']},
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
        req.session.token = token

        // token format
        // access_token
        // refresh_token
        // id_token
        const options_Xero = {
            url: "https://api.xero.com/connections",
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + req.session.token.access_token,
                'Timeout': 10000
            }            
        }
  
        let output = await axios.request(options_Xero)
        let tenantID = []
        output.data.forEach(tenant => {
            tenantID.push(tenant.tenantId)
        });
        req.session.tenantID=tenantID
        console.log(req.session)
        await mapping.appDB(req.session.token.access_token, req.session.tenantID[0])
        res.sendStatus(200)
    } catch(error){
        console.log(error)
        res.sendStatus(500)
    }
})


router.get("/logout", (req,res)=>{
    req.session.destroy()
    req.cookie['isLoggedin'] = false
    res.sendStatus(200)
})

module.exports = router;