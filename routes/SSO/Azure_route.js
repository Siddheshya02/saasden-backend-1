import { getEmps, getSubs } from '../../JS/SSO/Azure/utils.js'

import axios from 'axios'
import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    req.session.sso_tenantID = orgData.ssoData.tenantID
    req.session.sso_clientID = orgData.ssoData.clientID
    req.session.sso_clientSecret = orgData.ssoData.clientSecret
    // console.log("tenantId",orgData.ssoData.tenantID)
    const tokenSet = await axios.post(`https://login.microsoftonline.com/${req.session.sso_tenantID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: `${req.session.sso_clientID}`,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: `${req.session.sso_clientSecret}`,
        grant_type: 'client_credentials'
      })
    ).then(res => { return res.data.access_token }).catch(res => console.log(res))

    req.session.sso_accessToken = tokenSet // access token
    // req.session.sso_refreshToken = tokenSet.refresh_token // refresh token

    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.post('/auth', async (req, res) => {
  req.session.orgID = 'org_ioaseunclsd'
  const filter = { ID: req.session.orgID }
  const update = {
    ssoData: {
      clientID: req.body.clientID,
      clientSecret: req.body.clientSecret,
      tenantID: req.body.tenantID
    }
  }
  req.session.sso_tenantID = req.body.tenantID
  req.session.sso_clientID = req.body.clientID
  req.session.sso_clientSecret = req.body.clientSecret
  // console.log("tenantiD",req.body.tenantID)

  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('Azure credentials saved successfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/refreshData', async (req, res) => {
  console.log('Fetching Okta Data')
  const ems_creds = {
    domain: req.session.sso_apiDomain,
    tenantID: req.session.sso_tenantID,
    accessToken: req.session.sso_accessToken,
    apiToken: req.session.sso_apiToken
  }
  const sso_creds = {
    name: req.session.ems_name,
    domain: req.session.ems_domain,
    tenantID: req.session.ems_tenantID,
    accessToken: req.session.ems_accessToken,
    apiToken: req.session.ems_apiToken
  }
  const orgID = req.session.orgID
  console.log(req.session.sso_accessToken)
  // const domain = req.session.sso_domain
  // const apiToken = req.session.sso_apiToken
  try {
    // NOTE: Calling both the functions simultaneously exceeds the okta rate limit
    await getSubs(orgID, sso_creds, ems_creds)
    await getEmps(orgID, sso_creds)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
