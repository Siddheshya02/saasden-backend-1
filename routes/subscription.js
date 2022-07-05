const express = require('express')
const router = express.Router()
const axios = require('axios')
const options = require("../JS/utils")
const userAppSchema = require('../models/userApps')
const licence = require('../JS/licenses')

router.get("/", async(req, res)=>{
    const appList = await userAppSchema.find();
    let data = []
    let promises = []
    appList.forEach((app) => {
        promises.push(
            Promise.all([
                licence.totalAmount(app.contactID, req.cookies.access_token, req.cookies.tenantID[0]),
                licence.getActiveLicences(app.appID, req.cookies.oktaDomain, req.cookies.oktaAPIKey)
            ]).then((results)=>{
                data.push({
                    appID: app.appID,
                    status: results[1].status,
                    appName: app.appName,
                    licences_used: results[1].activeLicences,
                    licences_purchased: results[0].quantity,               
                    total_amount: results[0].txAmount,
                    renewalDate: results[0].renewalDate,
                    users: results[1].users //json -> userID, name
                })
            }).catch((error)=>{
                console.log(error)
            })
        )        
    })

    Promise.all(promises)
    .then(()=>{
        res.send(JSON.stringify(data))

    }).catch((error)=>{
        console.log(error)
        res.sendStatus(500)
    })
})

router.post("/app/deactivate", async(req, res)=>{
    const appID = req.body.appID
    const path = '/api/v1/apps/'+ appID +'/lifecycle/deactivate'
    const options_Okta = options.getOktaOptions(req.cookies.oktaDomain, path, 'POST', req.cookies.oktaAPIKey)
    try {
        await axios.request(options_Okta)
        res.sendStatus(200)
    } catch (error) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post("/app/activate", async(req, res)=>{
    const appID = req.body.appID
    const path = '/api/v1/apps/'+ appID +'/lifecycle/activate'
    const options_Okta = options.getOktaOptions(req.cookies.oktaDomain, path, 'POST', req.cookies.oktaAPIKey)
    try {
        await axios.request(options_Okta)
        res.sendStatus(200)
    } catch (error) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post("/employee/remove", async(req, res)=>{
    const appID = req.body.appID
    const usrID = req.body.usrID
    const path =  '/api/v1/apps/'+ appID +'/users/' + usrID
    const options_Okta = options.getOktaOptions(req.cookies.oktaDomain, path, 'POST', req.cookies.oktaAPIKey)
    try {
        await axios.request(options_Okta)
        res.sendStatus(200)
    } catch (error) {
        console.log(err)
        res.sendStatus(500)
    }
})


module.exports = router;