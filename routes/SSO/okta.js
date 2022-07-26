const router = require('express').Router()
const userModel = require('../models/user')


router.post("/", async(req, res) => {
    try {
        await userModel.findOneAndUpdate(
            {userName : req.session.username},
            {
                oktaDomain: req.body.oktaDomain,
                oktaAPIKey: req.body.oktaAPIKey
            },
            {new: true }
        )

        res.cookie("oktaDomain", req.body.oktaDomain,{httpOnly: 'true'})

        res.cookie("oktaAPIKey", req.body.oktaAPIKey,{
            httpOnly: 'true',
            maxAge: 25056000 //29 days
        })

        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

module.exports = router