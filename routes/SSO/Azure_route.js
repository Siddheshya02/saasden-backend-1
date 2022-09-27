const express = require('express')
const router = express.Router()

const ssoModel = require('../../models/sso')
const utils = require('../../JS/SSO/Azure/utils')
const subSchema = require('../../models/subscription')
const empSchema = require('../../models/employee')

router.post('/auth', async (req, res) => {
  // need to add a cookie with _id from user schema
  // const clientID = req.cookies.user_saasden_id
  const filter = { saasdenID: req.cookies.saasdenID }
  const update = {
    clientID: req.body.clientID,
    clientSecret: req.body.clientSecret,
    tenantId: req.body.tenantId
  }
  console.log('client  ', update)
  try {
    const user = await ssoModel.findOneAndUpdate(filter, update)
    console.log('Azure credentials saved successfully  =>', user)
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
    const accessToken = await utils.getToken(ssoData.clientID, ssoData.clientSecret, ssoData.tenantId)
    await utils.getSubs(accessToken, ssoData.saasdenID)
    await utils.getEmps(accessToken, ssoData.saasdenID)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

module.exports = router
