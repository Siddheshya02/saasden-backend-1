const express = require('express')
const router = express.Router()

const ssoSchema = require('../../models/sso')
const subSchema = require('../../models/subscription')
const empSchema = require('../../models/employee')
const utils = require('../../JS/SSO/OneLogin/utils')
let accessToken
router.post('/auth', async (req, res) => {
  // need to add a cookie with _id from user schema
  const saasdenID = req.cookies.user_saasden_id
  const filter = { user_saasden_id: saasdenID }
  const update = {
    clientID: req.body.client_id,
    clientSecret: req.body.client_secret
  }
  try {
    await ssoSchema.findOneAndDelete(filter, update)
    console.log('OneLogin Credentials saved succesfully')
    accessToken = await utils.getToken(req.body.subdomain, req.body.client_id, req.body.client_secret)
    console.log(accessToken)
    console.log('access token generated')
    await utils.getSubs(req.body.subdomain, accessToken, saasdenID)
    console.log('oneLogin subscriptions updated')
    await utils.getEmps(req.body.subdomain, accessToken, saasdenID)
    console.log('oneLogin emps updated')
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
