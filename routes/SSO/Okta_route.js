const express = require('express')
const router = express.Router()

const ssoSchema = require("../../models/sso")
const subSchema = require('../../models/subscription')
const empSchema = require("../../models/employee")

router("/auth",async(req, res)=>{
    //need to add a cookie with _id from user schema
    const clientID = req.cookie.user_saasden_id
    const filter = {clientID: clientID}
    const update = {
        envID: req.body.envID,
        apiToken: req.body.apiToken
    }
    try {
        await ssoSchema.findOneAndDelete(filter, update)
        console.log("Okta Credentials saved succesfully")
        res.sendStatus(200)    
    } catch (error) {
        console.log(error)
        res.sendStatus(500);
    }
})

router("/subs", async(req, res)=>{
    try {
        const subData = await subSchema.find({user_saasden_id: req.cookie.user_saasden_id})
        res.send(JSON.stringify(subData))   
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router("/emps",(req, res)=>{
    try {
        const empData = await empSchema.find({user_saasden_id: req.cookie.user_saasden_id})
        res.send(JSON.stringify(empData))    
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

module.exports = router;


// const router = require('express').Router()
// const userModel = require('../../models/user')


// router.post("/", async(req, res) => {
//     try {
//         await userModel.findOneAndUpdate(
//             {userName : req.session.username},
//             {
//                 oktaDomain: req.body.oktaDomain,
//                 oktaAPIKey: req.body.oktaAPIKey
//             },
//             {new: true }
//         )

//         res.cookie("oktaDomain", req.body.oktaDomain,{httpOnly: 'true'})

//         res.cookie("oktaAPIKey", req.body.oktaAPIKey,{
//             httpOnly: 'true',
//             maxAge: 25056000 //29 days
//         })

//         res.sendStatus(200)
//     } catch (error) {
//         console.log(error)
//         res.sendStatus(500)
//     }
// })

// module.exports = router