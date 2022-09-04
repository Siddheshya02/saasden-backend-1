const express = require('express')
const router = express.Router()

const ssoSchema = require('../../models/sso')
const subSchema = require('../../models/subscription')
const empSchema = require('../../models/employee')
const utils = require('../../JS/SSO/JumpCloud/utils')
router.post('/auth', async (req, res) => {
  // need to add a cookie with _id from user schema
  const saasdenID = req.cookies.user_saasden_id
  const filter = { user_saasden_id: saasdenID }
  const update = {
    apiToken: req.body.apiToken
  }
  try {
    await ssoSchema.findOneAndDelete(filter, update)
    console.log('JumpCloud Credentials saved succesfully')
    await utils.getSubs(req.body.apiToken, saasdenID)
    await utils.getEmps(req.body.apiToken, saasdenID)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/subs', async (req, res) => {
  try {
    const subData = await subSchema.find({ user_saasden_id: req.cookies.user_saasden_id })
    res.send(JSON.stringify(subData))
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/emps', async (req, res) => {
  try {
    const empData = await empSchema.find({ user_saasden_id: req.cookies.user_saasden_id })
    res.send(JSON.stringify(empData))
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

module.exports = router
