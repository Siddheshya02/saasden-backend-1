const router = require('express').Router()
const {Issuer}=require('openid-client')
const axios = require('axios')
const mapping = require('../JS/mapping')

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
        req.session.token = token // token format = {access_token, refresh_token, id_token}
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

module.exports = router