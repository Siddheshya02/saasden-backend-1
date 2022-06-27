const express = require('express')
const router = express.Router()
const request = require('request')
const {Issuer}=require('openid-client')


if(process.env.NODE_ENV!=='production')
    require('dotenv').config({ path: '../.env' })
const client_id =process.env.CLIENT_ID;
const client_secret =process.env.CLIENT_SECRET;
const redirectUrl =process.env.REDIRECT_URL
const scopes =process.env.SCOPES;

let client, inMemoryToken
Issuer
    .discover('https://identity.xero.com/')
    .then((issuer)=>{
        client=new issuer.Client({
            client_id:client_id,
            client_secret:client_secret
        })
    })
    .catch( e => console.log(e))



router.get('/',(req,res)=>{
    let consentUrl = client.authorizationUrl({
        redirect_uri: redirectUrl,
        scope: scopes,
    }); 
    res.send(`Sign in and connect with Xero using OAuth2! <br><a href="${consentUrl}">Connect to Xero</a>`)
})

router.get("/home", (req, res)=>{
    res.render("home")
})

router.get('/callback',async(req,res)=>{
    try{
        client.CLOCK_TOLERANCE=5
        Issuer.defaultHttpOptions = {timeout: 20000};
        const token = await client.callback(redirectUrl, req.query)
        inMemoryToken = token 
        let accessToken = token.access_token 
        req.session.accessToken=accessToken
        console.log('OAuth successful...\n\naccess token: \n' + accessToken + '\n')
        let idToken = token.id_token
        console.log('id token: \n' + idToken + '\n')
        console.log('id token claims: \n' + JSON.stringify(token.claims, null, 2));
        let refreshToken = token.refresh_token
        console.log('\nrefresh token: \n' + refreshToken)
        req.session.save()
        const connectionsRequestOptions = {
            url: 'https://api.xero.com/connections',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            auth: {
                'bearer': req.session.accessToken
            },
            timeout: 10000
        }
        request.get(connectionsRequestOptions, function (error, response, body) {
            if (error) {
                console.log('error from conenctionsRequest: ' + error)
            }
            let data = JSON.parse(body)
            let tenant = data
            tenant=data
            let tenantId=[];  
            for(let i=0;i<tenant.length;i++){
                tenantId.push(tenant[i]['tenantId'])     //tenant[i]['tenantId']
            }
            req.session.xeroTenantId=tenantId
            console.log('Retrieving connections...\n\ntenantId: \n' + tenantId)
            req.session.save()
        })
    }
    catch(e){
        console.log('ERROR: ' + e)
    }
    finally{
        res.redirect('/home')
    }
})


router.get('/getOrganisation',(req,res)=>{
    for(let i=0;i<req.session.xeroTenantId.length;i++){
        var organisationRequestOptions = {
            url: 'https://api.xero.com/api.xro/2.0/organisation',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'xero-tenant-id': req.session.xeroTenantId[i]
            },
            auth: {
                'bearer': req.session.accessToken
            }
        }
        
        request.get(organisationRequestOptions, function (error, response, body) {
            if(error)
                console.log('error from organisationRequest: ' + error)
            console.log('body: ' + body)     
        })
    }
    res.redirect('/home')
})


router.get('/getInvoices', async(req, res)=>{
    var invoicesRequestOptions = {
        url: 'https://api.xero.com/api.xro/2.0/invoices',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'xero-tenant-id': req.session.xeroTenantId
        },
        auth: {
            'bearer': req.session.accessToken
        }
    }

    request.get(invoicesRequestOptions, function (error, response, body) {
        if (error) 
            console.log('error from invoicesRequest: ' + error)

        console.log('body: ' + body)
        res.redirect('/home')
    })
})


router.get('/getBankTransactions',async(req,res)=>{
    const getBankTransactionOptions={
        url:'https://api.xero.com/api.xro/2.0/BankTransactions',
        headers:{
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'xero-tenant-id': req.session.xeroTenantId[0]
        },
        auth: {
            'bearer': req.session.accessToken
        }
    }
    request.get(getBankTransactionOptions,(error,response,body)=>{
        if(error)
            console.log('Error from bank transaction request : '+error)
        console.log('body : '+body)
        res.redirect('/home')
    })
})


router.get('/getBatchPayments',async(req,res)=>{
    const getBatchPayments={
        url:'https://api.xero.com/api.xro/2.0/BatchPayments',
        headers:{
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'xero-tenant-id': req.session.xeroTenantId[0]
        },
        auth: {
            'bearer': req.session.accessToken
        }
    }
    request.get(getBatchPayments,(error,response,body)=>{
        if(error)
        {
            console.log('Error from bank transaction request : '+error)
        }
        console.log('body : '+body)
        res.redirect('/home')
    })
})



router.get('/refreshToken', async function (req, res) {
    try {
        client.CLOCK_TOLERANCE = 5; 
        Issuer.defaultHttpOptions = {timeout: 20000};
        let newToken = await client.refresh(inMemoryToken.refresh_token);       
        req.session.accessToken = newToken.access_token     
        req.session.save()                                
        inMemoryToken = newToken
        console.log('Refresh successful...\n\nnew access token: \n' + newToken.access_token + '\n')
        console.log('new refresh token: ' + newToken.refresh_token)
    } catch (e) {
        console.log('refreshToken error: ' + e)
    } finally {
        res.redirect('/home')
    }
})

module.exports = router;