const express = require('express')
const router = express.Router()

const ssoModel = require('../../models/sso')
const subModel = require('../../models/subscription')
const empModel = require('../../models/employee')
const utils = require('../../JS/SSO/OneLogin/utils')

router.post('/auth', async (req, res) => {
  const filter = { saasdenID: req.cookies.saasdenID }
  const update = {
    clientID: req.body.clientID,
    clientSecret: req.body.clientSecret,
    domain: req.body.domain
  }
  try {
    await ssoModel.findOneAndUpdate(filter, update)
    console.log('OneLogin credentials saved successfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/refreshData', async (req, res) => {
  try {
    // fetch SSO Data from the DB
    const ssoData = await ssoModel.findOne({ saasdenID: req.cookies.saasdenID })
    const accessToken = await utils.getToken(ssoData.domain, ssoData.clientID, ssoData.clientSecret)
    await utils.getSubs(ssoData.domain, accessToken, ssoData.saasdenID)
    await utils.getEmps(ssoData.domain, accessToken, ssoData.saasdenID)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/subs', async (req, res) => {
  try {
    const subData = await subModel.find({ saasdenID: req.cookies.saasdenID })
    res.json(subData)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

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
