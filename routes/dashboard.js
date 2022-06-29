const express = require('express')
const router = express.Router()

router.get("/", (req, res)=>{
    var okta_apps = []
    const options_Okta = oktaOptions.getOptions('/api/v1/apps', 'GET')
    var output = await axios.request(options_Okta)
    output.data.forEach(app => okta_apps.push(app.name));
    console.log(okta_apps)
})


router.get("/apps")


module.exports = router;