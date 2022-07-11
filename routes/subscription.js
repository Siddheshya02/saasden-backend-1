const express = require('express')
const router = express.Router()
const axios = require('axios')
const options = require("../JS/utils")
const licences = require('../JS/licenses')
const subSchema = require("../models/subs")

router.get("/", (req, res)=>{
    try {
        const data = licences.getData(req.cookies.xero_access_token, req.cookies.xero_tenant_id[0])
        res.send(JSON.stringify(data))    
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.post("/app/deactivate", async(req, res)=>{
    const appID = req.body.appID
    const path = '/api/v1/apps/'+ appID +'/lifecycle/deactivate'
    const options_Okta = options.getOktaOptions(req.cookies.oktaDomain, path, 'POST', req.cookies.oktaAPIKey)
    try {
        await axios.request(options_Okta) //update okta
        await subSchema.findOneAndUpdate({appID : appID}, {$set:{status: 'INACTIVE'}}) //update cache
        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.post("/app/activate", async(req, res)=>{
    const appID = req.body.appID
    const path = '/api/v1/apps/'+ appID +'/lifecycle/activate'
    const options_Okta = options.getOktaOptions(req.cookies.oktaDomain, path, 'POST', req.cookies.oktaAPIKey)
    try {
        await axios.request(options_Okta) //update okta
        await subSchema.findOneAndUpdate({appID : appID}, {$set:{status: 'ACTIVE'}}) // update cache
        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.post("/employee/remove", async(req, res)=>{
    const appID = req.body.appID
    const usrID = req.body.usrID
    const path =  '/api/v1/apps/'+ appID +'/users/' + usrID
    const options_Okta = options.getOktaOptions(req.cookies.oktaDomain, path, 'DELETE', req.cookies.oktaAPIKey)
    
    console.log(options_Okta)
    
    try {
        await axios.request(options_Okta) // update okta
        await subSchema.findOneAndUpdate({appID : appID},{ // update cache
            $pull:{
                assignedUsers : {
                    userID: usrID
                }
            }
        })
        console.log("Succesfully removed the employee")
        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

module.exports = router;