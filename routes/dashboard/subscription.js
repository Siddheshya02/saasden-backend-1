const router = require('express').Router()
const subModel = require('../../models/subscription')

router.get('/subs', async (req, res) => {
  try {
    const subData = await subModel.find({ saasdenID: req.cookies.saasdenID })
    res.json(subData)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

module.exports = router
