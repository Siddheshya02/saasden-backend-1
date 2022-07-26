const express = require('express')
const router = express.Router()
const azureLogin = require("../../JS/azure/azureLogin")


router.get("/",(req, res)=>{
   azureLogin.getAuthCode(
    '7deee9f9-83db-4372-a384-df8f18938199', //client ID 
    'd33ada5f-cb55-4c3e-9d4f-e55d4b4b54b0', //tenant ID
    'http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fv1%2Fazure%2Fcallback') //redirect_uri
    .then(result => {
        res.send(result)
    }).catch(error => {
        res.sendStatus(500)
    })
})

router.get("/callback",(req, res)=>{
    console.log(req.query)
})

router.get("/")

module.exports = router;