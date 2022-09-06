const router = require('express').Router()
const subModel = require('../../models/subscription')

router.get('/subs', async (req, res) => {
  try {
    const subData = await subModel.findOne({ saasdenID: req.cookies.saasdenID })
    console.log(req.cookies.saasdenID)
    console.log(subData)
    res.json(subData)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

module.exports = router
