import { getEmps, getSubs } from '../../JS/SSO/Okta/utils.js'

import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    req.session.domain = orgData.ssoData.domain
    // console.log("data ",orgData.ssoData)
    req.session.apiToken = orgData.ssoData.apiToken
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
      domain: req.body.domain,
      apiToken: req.body.apiToken
    }
  }
  req.session.domain = req.body.domain
  // console.log("domain",req.body.domain);
  req.session.apiToken = req.body.apiToken
  // console.log("domain",req.body.apiToken);
  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('Okta Credentials saved succesfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/refreshData', async (req, res) => {
  console.log('Fetching Okta Data')
  try {
    // NOTE: Calling both the functions simultaneously exceeds the okta rate limit
    const sso_creds = {
      domain: req.session.domain,
      tenantID: req.session.sso_tenantID,
      accessToken: req.session.sso_accessToken,
      apiToken: req.session.apiToken
    }
    const ems_creds = {
      name: req.session.ems_name,
      domain: req.session.ems_domain,
      tenantID: req.session.ems_tenantID,
      accessToken: req.session.ems_accessToken,
      apiToken: req.session.ems_apiToken
    }
    await getSubs(req.session.orgID, sso_creds, ems_creds)
    await getEmps(req.session.orgID, sso_creds)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
