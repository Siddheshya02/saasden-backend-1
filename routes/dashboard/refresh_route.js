import { getEmps as getAzureEmps, getSubs as getAzureSubs, getNewToken as getNewAzureToken } from '../../JS/SSO/Azure/utils.js'
import { getEmps as getJumpCloudEmps, getSubs as getJumpCloudSubs, verifyToken as verifyJumpCloudToken } from '../../JS/SSO/JumpCloud/utils.js'
import { getNewToken as getNewOneLoginToken, getEmps as getOneLoginEmps, getSubs as getOneLoginSubs, verifyToken as verifyOneLoginToken } from '../../JS/SSO/OneLogin/utils.js'
import { getNewToken as getNewPingOneToken, getEmps as getPingOneEmps, getSubs as getPingOneSubs } from '../../JS/SSO/PingONE/utils.js'
import { getNewToken as getNewZohoToken, verifyToken as verifyZohoToken } from '../../JS/EMS/Zoho/utils.js'
import { getEmps as getOktaEmps, getSubs as getOktaSubs, verifyToken as verifyOktaToken } from '../../JS/SSO/Okta/utils.js'

import express from 'express'
import { getNewToken as getNewXeroToken } from '../../JS/EMS/Xero/utils.js'
import { isJwtExpired } from 'jwt-check-expiration'

const router = express.Router()

router.get('/refresh', async (req, res) => {
  const ssoName = req.session.sso_name
  const orgID = req.session.orgID
  const sso_creds = {
    domain: req.session.sso_domain,
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

  console.log('SSO Creds: ')
  console.log(sso_creds)

  console.log('EMS Creds: ')
  console.log(ems_creds)

  try {
    // Check EMS token validity
    if (req.session.ems_name === 'xero') {
      if (isJwtExpired(req.session.ems_accessToken)) {
        req.session.ems_accessToken = await getNewXeroToken(req.session.ems_clientID, req.session.ems_clientSecret, req.session.ems_refreshToken)
      }
    } else {
      if (!verifyZohoToken(req.session.ems_accessToken)) {
        req.session.ems_accessToken = await getNewZohoToken(req.session.ems_refreshToken, req.session.ems_clientID, req.session.ems_clientSecret)
      }
    }

    switch (ssoName) {
      case 'okta':
        if (!verifyOktaToken(req.session.sso_apiToken)) { res.send(`${process.env.domain}/okta/auth`).status(303) }
        console.log('Fetching okta data')
        await getOktaSubs(orgID, sso_creds, ems_creds)
        await getOktaEmps(orgID, sso_creds)
        break
      case 'pingone':
        if (isJwtExpired(req.session.sso_accessToken)) {
          req.session.sso_accessToken = await getNewPingOneToken(req.session.sso_domain, req.session.sso_clientID, req.session.sso_clientSecret, req.session.sso_tenantID)
        }
        console.log('Fetching pingone data')
        await getPingOneSubs(orgID, sso_creds, ems_creds)
        await getPingOneEmps(orgID, sso_creds)
        break
      case 'onelogin':
        if (!verifyOneLoginToken(req.session.sso_domain, req.session.sso_accessToken)) {
          getNewOneLoginToken(req.session.sso_domain, req.session.sso_clientID, req.session.sso_clientSecret)
        }
        console.log('Fetching onelogin data')
        await getOneLoginSubs(orgID, sso_creds, ems_creds)
        await getOneLoginEmps(orgID, sso_creds)
        break
      case 'jumpcloud':
        if (!verifyJumpCloudToken(req.session.sso_apiToken)) { res.send(`${process.env.domain}/jumpcloud/auth`).status(303) }
        console.log('Fetching jumpcloud data')
        await getJumpCloudSubs(orgID, sso_creds, ems_creds)
        await getJumpCloudEmps(orgID, sso_creds)
        break
      case 'azure':
        if (isJwtExpired(req.session.sso_accessToken)) {
          req.session.sso_accessToken = await getNewAzureToken(req.session.sso_clientID, req.session.sso_clientSecret, req.session.sso_tenantID)
        }
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
