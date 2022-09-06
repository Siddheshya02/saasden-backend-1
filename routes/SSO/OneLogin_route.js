const express = require('express')
const router = express.Router()

const utils = require('../../JS/SSO/OneLogin/utils')
const ssoModel = require('../../models/sso')

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

module.exports = router
