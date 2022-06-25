const express = require('express')
const router = express.Router()

router.post("/",(req, res)=>{
    res.sendStatus(403)
})

router.post("/signup",(req, res)=>{
    res.sendStatus(403)
})


module.exports = router;