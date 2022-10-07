import { getEmps, getSubs, getNewToken as newPingOneToken } from '../../JS/SSO/PingONE/utils.js'

import axios from 'axios'
import base64 from 'nodejs-base64-converter'
import express from 'express'
import { isJwtExpired } from 'jwt-check-expiration'
import { getNewToken as newXeroToken } from '../../JS/EMS/Xero/utils.js'
import orgSchema from '../../models/organization.js'
import url from 'url'
import { verifyZohoToken } from '../../JS/EMS/Zoho/utils.js'

const router = express.Router()

router.post('/auth', async (req, res) => {
  const filter = { ID: req.session.orgID }
  const update = {
    ssoData: {
      domain: req.body.domain,
      tenantID: req.body.tenantID,
      clientID: req.body.clientID,
      clientSecret: req.body.clientSecret
    }
  }

  try {
    await orgSchema.findOneAndUpdate(filter, update)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    req.session.sso_name = 'pingone'
    req.session.sso_domain = orgData.ssoData.domain
    req.session.sso_clientID = orgData.ssoData.clientID
    req.session.sso_clientSecret = orgData.ssoData.clientSecret
    req.session.sso_tenantID = orgData.ssoData.tenantID

    const client_creds = base64.encode(`${orgData.ssoData.clientID}:${orgData.ssoData.clientSecret}`)
    const params = new url.URLSearchParams({ grant_type: 'client_credentials' })
    const tokenSet = await axios.post(`https://auth.${req.session.sso_domain}/${req.session.sso_tenantID}/as/token`, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${client_creds}`
      }
    })
    req.session.sso_accessToken = tokenSet.data.access_token
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

// router.get('/refreshData', async (req, res) => {
//   // BUG: Untested
//   // if (isJwtExpired(req.session.sso_accessToken)) {
//   //   req.session.sso_accessToken = await newPingOneToken(req.session.sso_domain, req.session.sso_clientID, req.session.sso_clientSecret, req.session.sso_tenantID)
//   // }
//   // if (req.session.ems_name === 'xero') {
//   //   if (isJwtExpired(req.session.ems_accessToken)) {
//   //     req.session.ems_accessToken = await newXeroToken(req.session.ems_clientID, req.session.ems_clientSecret, req.session.ems_refreshToken)
//   //   }
//   // } else {
//   //   req.session.ems_accessToken = await verifyZohoToken(req.session.ems_accessToken, req.session.ems_refreshToken, req.session.ems_clientID, req.session.ems_clientSecret)
//   // }
//   console.log('Fetching PingOne Data')

//   const sso_creds = {
//     domain: req.session.sso_domain,
//     tenantID: req.session.sso_tenantID,
//     accessToken: req.session.sso_accessToken,
//     apiToken: req.session.sso_apiToken
//   }

//   const ems_creds = {
//     name: req.session.ems_name,
//     domain: req.session.ems_domain,
//     tenantID: req.session.ems_tenantID,
//     accessToken: req.session.ems_accessToken,
//     apiToken: req.session.ems_apiToken
//   }

//   try {
//     await getSubs(req.session.orgID, sso_creds, ems_creds)
//     await getEmps(req.session.orgID, sso_creds)
//     res.sendStatus(200)
//   } catch (error) {
//     console.log(error)
//     res.sendStatus(500)
//   }
// })

export { router }
