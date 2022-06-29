const express = require('express')
const router = express.Router()
const oktaOptions = require("./getOktaOptions")

router.get("/", async(req, res)=>{
    const options = oktaOptions.getOptions('/api/v1/users/', 'GET')
    const output = await axios.request(options)
    var data = []
    output.data.forEach(user => {
        data.push({
            usrID: user.id,
            name: user.profile.firstName + ' ' + user.profile.lastName,
        })
    });
    res.send(JSON.stringify(data))
})

router.get("/apps", async(req, res)=>{
    const usrID = req.query.usrID
    const options = oktaOptions.getOptions('/api/v1/apps/?filter=user.id+eq+'+usrID, 'GET')
    const output = await axios.request(options)
    var data = []
    output.data.forEach(app => {
        data.push({
            id : app.id,
            name: app.label,
            status: app.status
        })
    })
    res.send(JSON.stringify(data))
})


module.exports = router;