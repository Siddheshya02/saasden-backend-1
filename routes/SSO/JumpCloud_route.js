const express = require('express')
const router = express.Router()

const utils = require('../../JS/SSO/JumpCloud/utils')
const ssoModel = require('../../models/sso')

router.post('/auth', async (req, res) => {
  const filter = { saasdenID: req.cookies.saasdenID }
  const update = { apiToken: req.body.apiToken }
  try {
    await ssoModel.findOneAndUpdate(filter, update)
    console.log('JumpCloud Credentials saved succesfully')
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
    await utils.getSubs(ssoData.apiToken, ssoData.saasdenID)
    await utils.getEmps(ssoData.apiToken, ssoData.saasdenID)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

module.exports = router
