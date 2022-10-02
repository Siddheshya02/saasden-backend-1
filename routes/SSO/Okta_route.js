import { getEmps, getSubs } from '../../JS/SSO/Okta/utils.js'

import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.find({ name: req.session.orgID })
    req.session.sso_domain = orgData.ssoData.domain
    req.session.sso_apiToken = orgData.ssoData.apiToken
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.post('/auth', async (req, res) => {
  const filter = { name: req.session.orgID }
  const update = {
    ssoData: {
      domain: req.body.domain,
      apiToken: req.body.apiToken
    }
  }

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
    await getSubs(req.session.orgID, sso_creds, ems_creds)
    await getEmps(req.session.orgID, sso_creds)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
