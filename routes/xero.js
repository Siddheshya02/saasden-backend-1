const router = require('express').Router()
const {Issuer}=require('openid-client')
const axios = require('axios')
const mapping = require('../JS/initDB')

const client_id =process.env.CLIENT_ID;
const client_secret =process.env.CLIENT_SECRET;
const redirectUrl =process.env.REDIRECT_URL
const scopes =process.env.SCOPES;
var client

router.get("/", (req, res) => {
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
        Issuer.defaultHttpOptions = {timeout: 20000};
        client.CLOCK_TOLERANCE=5
        res.json({
            url: consentUrl
        })
    })
    .catch( (e) => {
        console.log(e)
        res.sendStatus(500)
    })
})

router.get("/callback", async(req,res)=>{
    try{
        const token = await client.callback(redirectUrl, req.query)
        const options_Xero = {
            url: "https://api.xero.com/connections",
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token.access_token,
                'Timeout': 10000
            }            
        }
        let output = await axios.request(options_Xero)
        let tenantID = []
        output.data.forEach(tenant => {
            tenantID.push(tenant.tenantId)
        });
        mapping.cacheSubscriptions(req.cookies.oktaDomain, req.cookies.oktaAPIKey, token.access_token, tenantID[0])

        res.cookie('xero_access_token', token.access_token,{
            maxAge: 174000, //29 minutues
            httpOnly: true,
        })
        res.cookie('xero_refresh_token', token.refresh_token,{httpOnly: true})
        res.cookie('xero_id_token', token.id_token, {httpOnly: true})
        res.cookie('xero_tenant_id', tenantID,{httpOnly: true})
        res.render("success")
    } catch(error){
        console.log(error)
        res.sendStatus(500)
    }
})


router.post("/refreshXeroToken", async(req,res)=>{
    try {
        client.CLOCK_TOLERANCE = 5; 
        Issuer.defaultHttpOptions = {timeout: 20000};
        let newToken = await client.refresh(req.cookies.xero_refresh_token)
        res.cookie('xero_access_token', newToken.access_token,{
            maxAge: 174000, //29 minutues
            httpOnly: true,
        })  
        res.sendStatus(200)
    } catch (e) {
        console.log('refreshToken error: ' + e)
        res.sendStatus(200)
    }
})

module.exports = router