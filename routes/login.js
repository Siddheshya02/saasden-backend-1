const passport = require('passport')
const userModel = require('../models/user')
const router = require('express').Router()

router.post("/signup",(req, res, next)=>{
    console.log(req.body)
    userModel.register({
        username: req.body.username,
        name: req.body.name,
        companyName: req.body.companyName,
        workEmail: req.body.workEmail,
    }, req.body.password, (err)=>{
        if(err){
            console.log("Error in Signup")
            res.sendStatus(500)
            return next(err)
        } else {
            res.sendStatus(200)
        }
    })
})


router.get("/test",(req,res)=>{
    res.render("login")
})

router.post("/login", passport.authenticate('local', {failureRedirect: ''}) ,(req, res)=>{ //put login route of frontend here 
    req.session.username = req.body.username
    res.cookie('isLoggedin', true)
    res.cookie('username', req.body.username)
    res.redirect("/xero")
})

router.get("/logout", (req,res)=>{
    req.session.destroy()
    req.cookie['isLoggedin'] = false
    res.sendStatus(200)
})

module.exports = router;