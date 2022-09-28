import axios from 'axios'
import express from 'express'
import orgSchema from '../../models/organization.js'
const router = express.Router()

// const utils = require('../../JS/SSO/OneLogin/utils')
// const ssoModel = require('../../models/sso')

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.find({ name: req.session.orgName })
    req.session.sso_apiDomain = orgData.ssoData.apiDomain
    req.session.sso_clientID = orgData.ssoData.clientID
    req.session.sso_clientSecret = orgData.ssoData.clientSecret

    const tokenSet = await axios.post(`https://${req.session.sso_apiDomain}/auth/oauth2/v2/token`, {
      client_id: req.session.sso_clientID,
      client_secret: req.session.sso_clientSecret,
      grant_type: 'client_credentials'
    }, {
      'Content-Type': 'application/x-www-form-urlencoded'
    })

    req.session.sso_accessToken = tokenSet.access_token // access token
    req.session.sso_refreshToken = tokenSet.refresh_token // refresh token

    res.sendStatus(200)
    // differrent from other apis as this sends ok status on getting access token
  } catch (error) {
    console.log(error)
  }
})

router.post('/auth', async (req, res) => {
  const filter = { name: req.session.orgName }
  const update = {
    ssoData: {
      clientID: req.body.clientID,
      clientSecret: req.body.clientSecret,
      domain: req.body.domain
    }
  }

  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('OneLogin credentials saved successfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

// access_token => req.sesion.sso_accessToken
// client ID => req.session.sso_clientID
// client Secret => req.session.sso_clientSecret
// tenant ID => req.session.sso_tenantID

// needs to be changed
// router.get('/refreshData', async (req, res) => {
//   try {
//     // fetch SSO Data from the DB
//     const ssoData = await ssoModel.findOne({ saasdenID: req.cookies.saasdenID })
//     const accessToken = await utils.getToken(ssoData.domain, ssoData.clientID, ssoData.clientSecret)
//     await utils.getSubs(ssoData.domain, accessToken, ssoData.saasdenID)
//     await utils.getEmps(ssoData.domain, accessToken, ssoData.saasdenID)
//     res.sendStatus(200)
//   } catch (error) {
//     console.log(error)
//     res.sendStatus(500)
//   }
// })

export { router }
