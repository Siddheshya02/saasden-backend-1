import { getEmps as getAzureEmps, getSubs as getAzureSubs, getNewToken as getNewAzureToken, getGroups as getAzureGroups } from '../../JS/SSO/Azure/utils.js'
import { getEmps as getJumpCloudEmps, getSubs as getJumpCloudSubs, verifyToken as verifyJumpCloudToken, getGroups as getJumpCloudGroups } from '../../JS/SSO/JumpCloud/utils.js'
import { getNewToken as getNewOneLoginToken, getEmps as getOneLoginEmps, getSubs as getOneLoginSubs, getGroups as getOneLoginGroups, verifyToken as verifyOneLoginToken } from '../../JS/SSO/OneLogin/utils.js'
import { getNewToken as getNewPingOneToken, getEmps as getPingOneEmps, getSubs as getPingOneSubs, getGroups as getPingOneGroups } from '../../JS/SSO/PingONE/utils.js'
import { getNewToken as getNewZohoToken, verifyToken as verifyZohoToken } from '../../JS/EMS/Zoho/utils.js'
import { getEmps as getOktaEmps, getSubs as getOktaSubs, getGroups as getOktaGroups, verifyToken as verifyOktaToken } from '../../JS/SSO/Okta/utils.js'
import { getScriptTags } from '../../JS/AppDiscovery/Shopify/utils.js'
import express from 'express'
import { getNewToken as getNewXeroToken } from '../../JS/EMS/Xero/utils.js'
import { isJwtExpired } from 'jwt-check-expiration'

const router = express.Router()

router.get('/', async (req, res) => {
  // const ssoName = req.session.sso_name
  const orgID = req.session.orgID
  const sso_creds = []
  for (const sso of req.session.ssos) {
    sso_creds.push(sso)
  }
  // const sso_creds = {
  //   domain: req.session.sso_domain,
  //   tenantID: req.session.sso_tenantID,
  //   accessToken: req.session.sso_accessToken,
  //   apiToken: req.session.sso_apiToken
  // }
  const ems_creds = {
    name: req.session.ems_name,
    domain: req.session.ems_domain,
    tenantID: req.session.ems_tenantID,
    accessToken: req.session.ems_accessToken,
    apiToken: req.session.ems_apiToken
  }
  try {
    // Check EMS token validity
    // if (ems_creds.name === 'xero') {
    //   if (isJwtExpired(ems_creds.accessToken)) {
    //     ems_creds.accessToken = await getNewXeroToken(ems_creds.clientID, ems_creds.clientSecret, ems_creds.refreshToken)
    //   }
    // } else {
    //   if (!verifyZohoToken(ems_creds.accessToken, ems_creds.tenantID)) {
    //     ems_creds.accessToken = await getNewZohoToken(ems_creds.refreshToken, ems_creds.clientID, ems_creds.clientSecret)
    //   }
    // }
    for (const sso of sso_creds) {
      const ssoName = sso.ssoName
      console.log(ssoName)
      switch (ssoName) {
        case 'okta':
          if (!verifyOktaToken(sso.domain, sso.apiToken)) { res.send(`${process.env.domain}/okta/auth`).status(303) }
          console.log('Fetching okta data')
          await getOktaSubs(orgID, sso, ems_creds)
          await getOktaEmps(orgID, sso)
          await getOktaGroups(orgID, sso)
          break
        case 'pingone':
          if (isJwtExpired(sso_creds.accessToken)) {
            sso_creds.accessToken = await getNewPingOneToken(sso_creds.domain, sso_creds.clientID, sso_creds.clientSecret, sso_creds.tenantID)
          }
          console.log('Fetching pingone data')
          await getPingOneSubs(orgID, sso_creds, ems_creds)
          await getPingOneEmps(orgID, sso_creds)
          await getPingOneGroups(orgID, sso_creds)
          break
        case 'onelogin':
          if (!verifyOneLoginToken(sso.domain, sso.access_token)) {
            getNewOneLoginToken(sso.domain, sso.clientID, sso.clientSecret)
          }
          console.log('Fetching onelogin data')
          await getOneLoginSubs(orgID, sso, ems_creds)
          await getOneLoginEmps(orgID, sso)
          await getOneLoginGroups(orgID, sso)
          break
        case 'jumpcloud':
          if (!verifyJumpCloudToken(sso.apiToken)) { res.send(`${process.env.domain}/jumpcloud/auth`).status(303) }
          console.log('Fetching jumpcloud data')
          await getJumpCloudSubs(orgID, sso, ems_creds)
          await getJumpCloudEmps(orgID, sso)
          await getJumpCloudGroups(orgID, sso)
          // await getScriptTags(orgID, 'https://shobitam.com/')
          break
        case 'azure':
          if (isJwtExpired(sso_creds.accessToken)) {
            sso_creds.accessToken = await getNewAzureToken(sso_creds.clientID, sso_creds.clientSecret, sso_creds.tenantID)
          }
          console.log('Fetching azure data')
          await getAzureSubs(orgID, sso_creds, ems_creds)
          await getAzureEmps(orgID, sso_creds)
          await getAzureGroups(orgID, sso_creds)
          break
      }
    }
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
