const express = require('express')
const router = express.Router()
const axios = require('axios')
const oktaOptions = require("../JS/getOktaOptions")
const userAppSchema = require('../models/userApps')
const licence = require('../JS/licenses')

router.get("/", async(req, res)=>{
    const appList = await userAppSchema.find();
    var data = []
    appList.forEach(app => {
        var txDetails = await licence.totalAmount() //vadiraj's function
        var userList = await licence.getActiveLicences(app.id)
        data.push({
            appID: app.id,
            appName: app.label, //or name, check
            licences_purchased: txDetails.quantity,
            licences_used : userList.length,
            total_amount: txDetails.totalAmount,
            renewalDate: txDetails.renewalDate,
            status: app.status,
            users: userList //json -> userID, name
        })
    });
    res.send(JSON.stringify(data))
})


router.post("/app/deactivate", async(req, res)=>{
    const appID = req.body.appID
    const path = '/api/v1/apps/'+ appID +'/lifecycle/deactivate'
    const options = oktaOptions.getOptions(path, 'POST')
    try {
        await axios.request(options)
        res.sendStatus(200)
    } catch (error) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post("/app/activate", async(req, res)=>{
    const appID = req.body.appID
    const path = '/api/v1/apps/'+ appID +'/lifecycle/activate'
    const options = oktaOptions.getOptions(path, 'POST')
    try {
        await axios.request(options)
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
    const options = oktaOptions.getOptions(path, 'POST')
    try {
        await axios.request(options)
        res.sendStatus(200)
    } catch (error) {
        console.log(err)
        res.sendStatus(500)
    }
})


module.exports = router;