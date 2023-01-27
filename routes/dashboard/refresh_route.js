import { getEmps as getAzureEmps, getSubs as getAzureSubs, getNewToken as getNewAzureToken, getGroups as getAzureGroups } from '../../JS/SSO/Azure/utils.js'
import { getEmps as getJumpCloudEmps, getSubs as getJumpCloudSubs, verifyToken as verifyJumpCloudToken, getGroups as getJumpCloudGroups } from '../../JS/SSO/JumpCloud/utils.js'
import { getNewToken as getNewOneLoginToken, getEmps as getOneLoginEmps, getSubs as getOneLoginSubs, getGroups as getOneLoginGroups, verifyToken as verifyOneLoginToken } from '../../JS/SSO/OneLogin/utils.js'
import { getNewToken as getNewPingOneToken, getEmps as getPingOneEmps, getSubs as getPingOneSubs, getGroups as getPingOneGroups } from '../../JS/SSO/PingONE/utils.js'
import { getNewToken as getNewZohoToken, verifyToken as verifyZohoToken, getZohoData } from '../../JS/EMS/Zoho/utils.js'
import { getEmps as getOktaEmps, getSubs as getOktaSubs, getGroups as getOktaGroups, verifyToken as verifyOktaToken } from '../../JS/SSO/Okta/utils.js'
import { getScriptTags } from '../../JS/AppDiscovery/Shopify/utils.js'
import express from 'express'
import { getNewToken as getNewXeroToken, getXeroData } from '../../JS/EMS/Xero/utils.js'
import { isJwtExpired } from 'jwt-check-expiration'
import empSchema from '../../models/employee.js'
import subSchema from '../../models/subscription.js'
import groupSchema from '../../models/groups.js'
import appDiscoverySchema from '../../models/appDiscovery.js'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.get('/', async (req, res) => {
  // const ssoName = req.session.sso_name
  const orgID = req.session.orgID
  // deleting the data already present in the db of the organization
  await empSchema.deleteOne({ ID: orgID })
  await empSchema.insertMany({ ID: orgID })
  await subSchema.deleteOne({ ID: orgID })
  await subSchema.insertMany({ ID: orgID })
  await groupSchema.deleteOne({ ID: orgID })
  await groupSchema.insertMany({ ID: orgID })
  await appDiscoverySchema.deleteOne({ ID: orgID })
  await appDiscoverySchema.insertMany({ ID: orgID })

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
          if (isJwtExpired(sso.access_token)) {
            sso.access_token = await getNewPingOneToken(sso.domain, sso.clientID, sso.clientSecret, sso.tenantID)
          }
          console.log('Fetching pingone data')
          await getPingOneSubs(orgID, sso, ems_creds)
          await getPingOneEmps(orgID, sso)
          await getPingOneGroups(orgID, sso)
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
          if (isJwtExpired(sso.access_token)) {
            sso.accessToken = await getNewAzureToken(sso.clientID, sso.clientSecret, sso.tenantID)
          }
          console.log('Fetching azure data')
          await getAzureSubs(orgID, sso, ems_creds)
          await getAzureEmps(orgID, sso)
          await getAzureGroups(orgID, sso)
          break
      }
    }
    if (ems_creds.name) {
      console.log(ems_creds)
      if (ems_creds.name === 'xero') {
        if (isJwtExpired(ems_creds.accessToken)) {
          ems_creds.accessToken = await getNewXeroToken(ems_creds.clientID, ems_creds.clientSecret, ems_creds.refreshToken)
        }
      } else {
        if (!verifyZohoToken(ems_creds.accessToken, ems_creds.tenantID)) {
          ems_creds.accessToken = await getNewZohoToken(ems_creds.refreshToken, ems_creds.clientID, ems_creds.clientSecret)
        }
      }
      const subs = await subSchema.findOne({ ID: req.session.orgID })
      let subData = {
        subList: subs.apps,
        amtSaved: 0,
        amtSpent: 0
      }
      switch ((ems_creds.name).toLowerCase()) {
        case 'xero':
          subData = await getXeroData(ems_creds.tenantID, ems_creds.accessToken, subData)
          break
        case 'zoho':
          subData = await getZohoData(ems_creds.tenantID, ems_creds.accessToken, subData)
          break
      }
    }
    return res.sendStatus(200)
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

router.get('/delete', async (req, res) => {
  // //req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const orgID = req.session.orgID
  await orgSchema.deleteOne({ ID: orgID })
  await orgSchema.insertMany({ ID: orgID, name: 'techlight' })
  await empSchema.deleteOne({ ID: orgID })
  await empSchema.insertMany({ ID: orgID })
  await subSchema.deleteOne({ ID: orgID })
  await subSchema.insertMany({ ID: orgID })
  await groupSchema.deleteOne({ ID: orgID })
  await groupSchema.insertMany({ ID: orgID })
  await appDiscoverySchema.deleteOne({ ID: orgID })
  await appDiscoverySchema.insertMany({ ID: orgID })
  res.sendStatus(200)
})

export { router }
