const axios = require("axios")
const express = require("express");
const router = express.Router()

router.get("/getToken",(req, res)=>{
    axios.post("https://login.microsoftonline.com/d33ada5f-cb55-4c3e-9d4f-e55d4b4b54b0/oauth2/v2.0/token")
})

router.get("/subscription", (req, res)=>{
    
})

router.get("/employee", (req, res)=>{
    
})

router.post("/removeApp", (req, res)=>{
    
})

router.post("/removeUser", (req, res)=>{
    
})

router.post("/addUser", (req, res)=>{
    
})

module.exports = router;