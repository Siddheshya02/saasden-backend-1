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
        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

module.exports = router