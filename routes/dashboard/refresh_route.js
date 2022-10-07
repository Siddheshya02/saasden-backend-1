import { getEmps as getAzureEmps, getSubs as getAzureSubs } from '../../JS/SSO/Azure/utils.js'
import { getEmps as getJumpCloudEmps, getSubs as getJumpCloudSubs } from '../../JS/SSO/JumpCloud/utils.js'
import { getEmps as getOktaEmps, getSubs as getOktaSubs } from '../../JS/SSO/Okta/utils.js'
import { getEmps as getOneLoginEmps, getSubs as getOneLoginSubs } from '../../JS/SSO/OneLogin/utils.js'
import { getEmps as getPingOneEmps, getSubs as getPingOneSubs } from '../../JS/SSO/PingONE/utils.js'

import express from 'express'
import { isJwtExpired } from 'jwt-check-expiration'
import { getNewToken as newXeroToken } from '../../JS/EMS/Xero/utils.js'
import { verifyZohoToken } from '../../JS/EMS/Zoho/utils.js'

const router = express.Router()

router.get('/refresh', async (req, res) => {
  const ssoName = req.session.sso_name
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
    // Check EMS token validity
    // if (req.session.ems_name === 'xero') {
    //   if (isJwtExpired(req.session.ems_accessToken)) {
    //     req.session.ems_accessToken = await newXeroToken(req.session.ems_clientID, req.session.ems_clientSecret, req.session.ems_refreshToken)
    //   }
    // } else {
    //   req.session.ems_accessToken = await verifyZohoToken(req.session.ems_accessToken, req.session.ems_refreshToken, req.session.ems_clientID, req.session.ems_clientSecret)
    // }

    switch (ssoName) {
      case 'okta':
        console.log('Fetching okta data')
        await getOktaSubs(orgID, sso_creds, ems_creds)
        await getOktaEmps(orgID, sso_creds)
        break
      case 'pingone':
        console.log('Fetching pingone data')
        await getPingOneSubs(orgID, sso_creds, ems_creds)
        await getPingOneEmps(orgID, sso_creds)
        break
      case 'onelogin':
        console.log('Fetching onelogin data')
        await getOneLoginSubs(orgID, sso_creds, ems_creds)
        await getOneLoginEmps(orgID, sso_creds)
        break
      case 'jumpcloud':
        console.log('Fetching jumpcloud data')
        await getJumpCloudSubs(orgID, sso_creds, ems_creds)
        await getJumpCloudEmps(orgID, sso_creds)
        break
      case 'azure':
        console.log('Fetching azure data')
        await getAzureSubs(orgID, sso_creds, ems_creds)
        await getAzureEmps(orgID, sso_creds)
        break
    }
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
