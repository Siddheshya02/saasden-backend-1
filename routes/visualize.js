const express = require('express')
const router = express.Router()

router.get("/", (req, res)=>{
    res.send("Page in development")
})

router.post("/populate",(req, res) => {
    
})


router.get("/apps")


module.exports = router;