const express = require('express')
const router = express.Router()
const axios = require('axios')
const options = require('../JS/utils')

router.get("/", async(req, res)=>{
    const options_Okta = options.getOktaOptions(req.cookies.oktaDomain, '/api/v1/users/', 'GET', req.cookies.oktaAPIKey)
    const output = await axios.request(options_Okta)
    var data = []
    output.data.forEach(user => {
        data.push({
            userID: user.id,
            name: user.profile.firstName + ' ' + user.profile.lastName,
        })
    });
    res.send(JSON.stringify(data))
})

router.get("/apps", async(req, res)=>{
    const usrID = req.query.usrID
    const options_Okta = options.getOktaOptions(req.cookies.oktaDomain, '/api/v1/apps/?filter=user.id+eq+%22' + usrID + '%22', 'GET', req.cookies.oktaAPIKey)
    console.log(options_Okta)
    try {
        const output = await axios.request(options_Okta)
        var data = []
        output.data.forEach(app => {
            data.push({
                appID : app.id,
                name: app.label,
                status: app.status
            })
        })
        res.send(JSON.stringify(data))   
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

module.exports = router;