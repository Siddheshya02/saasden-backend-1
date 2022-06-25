const passport = require('passport')
const User = require('../models/user')
const router = require('express').Router()

router.post("/", passport.authenticate('local', {failureRedirect: '/login'}) ,(req, res)=>{
    res.sendStatus(200)
})

router.post("/signup",(req, res, next)=>{
    User.register({username: req.body.username, email: req.body.email}, req.body.password, (err)=>{
        if(err){
            console.log("Error in Signup")
            return next(err)
        }
    })
    res.sendStatus(200)
})


module.exports = router;