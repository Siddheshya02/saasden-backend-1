const express = require('express')
const router = express.Router()

const utils = require('../../JS/SSO/Okta/utils')
const ssoModel = require('../../models/sso')

router.post('/auth', async (req, res) => {
  const filter = { saasdenID: req.cookies.saasdenID }
  const update = {
    domain: req.body.domain, // okta domain here
    apiToken: req.body.apiToken // okta api token here
  }
  try {
    await ssoModel.findOneAndUpdate(filter, update) // save the domain and api token in the db
    console.log('Okta Credentials saved succesfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/refreshData', async (req, res) => {
  console.log('Fetching Okta Data')
  try {
    // fetch SSO Data from the DB
    const ssoData = await ssoModel.findOne({ saasdenID: req.cookies.saasdenID })
    // Rate limit exceeded here
    // await utils.getSubs(ssoData.domain, ssoData.apiToken, ssoData.saasdenID)
    await utils.getEmps(ssoData.domain, ssoData.apiToken, ssoData.saasdenID)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

module.exports = router
