const passport = require('passport')
const User = require('../models/user')
const router = require('express').Router()

router.post("/", passport.authenticate('local', {failureRedirect: '/login'}) ,(req, res)=>{ 
    res.sendStatus(200)
    //userName
    //password
})

router.post("/signup",(req, res, next)=>{
    User.register({
        name: req.body.name,
        companyName: req.body.companyName,
        workEmail: req.body.workEmail,
        userName: req.body.userName,
        xeroID: req.body.xeroID,
        oktaDomain: req.body.oktaDomain,
        oktaAPIKey: req.body.APIKey,
    }, req.body.password, (err)=>{
        if(err){
            console.log("Error in Signup")
            return next(err)
        }
    })
    res.sendStatus(200)
})

router.get("/logout", (req,res)=>{
    //logout logic goes here
    res.sendStatus(200)
})


module.exports = router;