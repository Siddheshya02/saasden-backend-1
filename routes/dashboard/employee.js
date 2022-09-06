const router = require('express').Router()
const empModel = require('../../models/employee')

router.get('/emps', async (req, res) => {
  try {
    const empData = await empModel.find({ saasdenID: req.cookies.saasdenID })
    res.json(empData)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

module.exports = router
