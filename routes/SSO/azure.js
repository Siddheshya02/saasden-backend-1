const axios = require('axios')
const express = require('express')
const azureFunc = require("../../JS/azure/azureLogin")
const router = express.Router()

router.get("/", (req, res)=>{    
    const uri = 'https://login.microsoftonline.com/d33ada5f-cb55-4c3e-9d4f-e55d4b4b54b0/oauth2/v2.0/token'
    const params = new URLSearchParams()
    params.append('client_id', '48a0fa33-7982-46b6-a712-3156b8d9dab9')
    params.append('client_secret', 'w368Q~30uK4lCbyVmZFPYvUxsVLpTbHOihj22ben')
    params.append('scope', 'api://48a0fa33-7982-46b6-a712-3156b8d9dab9/.default')
    params.append('grant_type', 'client_credentials')
    
    axios.post(uri, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded' 
        }
    }).then(result=>{
        azureFunc.getSubs(result.data.access_token)
        res.sendStatus(200)
    }).catch(error=>{
        console.log(error)
        res.sendStatus(500)
    })        
})

router.get("/getUsers", (req, res)=>{
    res.send("Page in Development")
})


router.get("/getEmployees", (req, res)=>{
    res.send("Page in Development")
})


module.exports = router;