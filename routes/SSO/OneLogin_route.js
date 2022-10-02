import { getEmps, getSubs } from '../../JS/SSO/OneLogin/utils.js'

import axios from 'axios'
import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

// const utils = require('../../JS/SSO/OneLogin/utils')
// const ssoModel = require('../../models/sso')

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    console.log(orgData)
    req.session.sso_apiDomain = orgData.ssoData.domain
    req.session.sso_clientID = orgData.ssoData.clientID
    req.session.sso_clientSecret = orgData.ssoData.clientSecret

    const tokenSet = await axios.post(`https://${req.session.sso_apiDomain}/auth/oauth2/v2/token`, {
      client_id: req.session.sso_clientID,
      client_secret: req.session.sso_clientSecret,
      grant_type: 'client_credentials'
    }, {
      'Content-Type': 'application/x-www-form-urlencoded'
    })
    req.session.sso_accessToken = tokenSet.data.access_token // access token
    req.session.sso_refreshToken = tokenSet.data.refresh_token // refresh token
    res.sendStatus(200)
    // differrent from other apis as this sends ok status on getting access token
  } catch (error) {
    console.log(error)
  }
})

router.post('/auth', async (req, res) => {
  req.session.orgID = 'org_sad78dsfbsdbfs'
  const filter = { ID: req.session.orgID }
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

// needs to be changed
router.get('/refreshData', async (req, res) => {
  console.log('Fetching oneLogin Data')
  const ems_creds = {
    name: req.session.ems_name,
    domain: undefined,
    tenantID: undefined,
    accessToken: req.session.ems_accessToken,
    apiToken: req.session.ems_IDToken
  }
  const sso_creds = {
    name: undefined,
    domain: req.session.sso_apiDomain,
    tenantID: undefined,
    accessToken: req.session.sso_accessToken,
    apiToken: undefined
  }
  console.log(sso_creds)
  console.log(ems_creds)
  try {
    await getSubs(req.session.orgID, sso_creds, ems_creds)
    await getEmps(req.session.orgID, sso_creds)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

// domain query

export { router }
