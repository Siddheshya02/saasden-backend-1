import { getEmps, getSubs, verifyOneLoginToken } from '../../JS/SSO/OneLogin/utils.js'

import axios from 'axios'
import express from 'express'
import { isJwtExpired } from 'jwt-check-expiration'
import { getNewToken as newXeroToken } from '../../JS/EMS/Xero/utils.js'
import orgSchema from '../../models/organization.js'
import { verifyZohoToken } from '../../JS/EMS/Zoho/utils.js'

const router = express.Router()

router.post('/auth', async (req, res) => {
  console.log(req.body)
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

router.get('/', async (req, res) => {
  console.log(req.session)
  try {
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
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
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/refreshData', async (req, res) => {
  // BUG: Untested
  // req.session.sso_accessToken = await verifyOneLoginToken(req.session.sso_domain, req.session.sso_clientID, req.session.sso_clientSecret, req.session.sso_accessToken)
  // if (req.session.ems_name === 'xero') {
  //   if (isJwtExpired(req.session.ems_accessToken)) {
  //     req.session.ems_accessToken = await newXeroToken(req.session.ems_clientID, req.session.ems_clientSecret, req.session.ems_refreshToken)
  //   }
  // } else {
  //   req.session.ems_accessToken = await verifyZohoToken(req.session.ems_accessToken, req.session.ems_refreshToken, req.session.ems_clientID, req.session.ems_clientSecret)
  // }

  console.log('Fetching OneLogin Data')

  const orgID = req.session.orgID
  const sso_creds = {
    domain: req.session.sso_apiDomain,
    tenantID: req.session.sso_tenantID,
    accessToken: req.session.sso_accessToken,
    apiToken: req.session.sso_apiToken
  }
  const ems_creds = {
    name: req.session.ems_name,
    domain: req.session.ems_domain,
    tenantID: req.session.ems_tenantID,
    accessToken: req.session.ems_accessToken,
    apiToken: req.session.ems_apiToken
  }

  try {
    await getSubs(orgID, sso_creds, ems_creds)
    await getEmps(orgID, sso_creds)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
