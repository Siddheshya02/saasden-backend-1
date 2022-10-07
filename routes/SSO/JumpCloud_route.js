import { checkJumpCloudToken, getEmps, getSubs } from '../../JS/SSO/JumpCloud/utils.js'

import express from 'express'
import { isJwtExpired } from 'jwt-check-expiration'
import { getNewToken as newXeroToken } from '../../JS/EMS/Xero/utils.js'
import orgSchema from '../../models/organization.js'
import { verifyZohoToken } from '../../JS/EMS/Zoho/utils.js'

const router = express.Router()

router.post('/auth', async (req, res) => {
  const filter = { ID: req.session.orgID }
  const update = {
    ssoData: {
      apiToken: req.body.apiToken
    }
  }
  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('Jumpcloud Credentials saved succesfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    req.session.sso_name = 'jumpcloud'
    req.session.sso_apiToken = orgData.ssoData.apiToken
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

// router.get('/refreshData', async (req, res) => {
//   // BUG: Untested
//   // if (checkJumpCloudToken(req.session.sso_apiToken)) { res.send(`${process.env.domain}/jumpcloud/auth`).status(303) }
//   // if (req.session.ems_name === 'xero') {
//   //   if (isJwtExpired(req.session.ems_accessToken)) {
//   //     req.session.ems_accessToken = await newXeroToken(req.session.ems_clientID, req.session.ems_clientSecret, req.session.ems_refreshToken)
//   //   }
//   // } else {
//   //   req.session.ems_accessToken = await verifyZohoToken(req.session.ems_accessToken, req.session.ems_refreshToken, req.session.ems_clientID, req.session.ems_clientSecret)
//   // }
//   console.log('Fetching Jumpcloud Data')

//   const orgID = req.session.orgID
//   const sso_creds = {
//     domain: req.session.sso_apiDomain,
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
//     await getSubs(orgID, sso_creds, ems_creds)
//     await getEmps(orgID, sso_creds)
//     res.sendStatus(200)
//   } catch (error) {
//     console.log(error)
//     res.sendStatus(500)
//   }
// })

export { router }
