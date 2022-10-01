import { getEmps, getSubs } from '../../JS/SSO/Okta/utils.js'

import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.find({ name: req.session.orgID })
    req.session.domain = orgData.ssoData.domain
    req.session.apiToken = orgData.ssoData.apiToken
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
      domain: req.body.domain, // okta domain here
      apiToken: req.body.apiToken // okta api token here, long lived
    }
  }

  try {
    await orgSchema.findOneAndUpdate(filter, update) // save the domain and api token in the db
    console.log('Okta Credentials saved succesfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

// access_token => req.sesion.sso_accessToken
// client ID => req.session.sso_clientID
// client Secret => req.session.sso_clientSecret
// tenant ID => req.session.sso_tenantID

/* NOTE: ems/sso _creds object should be passed along like this, irrelevent data should be set to null, name should have name of EMS/SSO
      ems_creds = {
        name,
        domain,
        tenantID,
        accessToken,
        apiToken
      }

      sso_creds = {
        name,
        domain,
        tenantID,
        accessToken,
        apiToken
      }
*/

router.get('/refreshData', async (req, res) => {
  console.log('Fetching Okta Data')
  const orgID = req.session.orgID
  const domain = req.session.sso_domain
  const apiToken = req.session.sso_apiToken
  try {
    // NOTE: Calling both the functions simultaneously exceeds the okta rate limit
    const sso_creds = {
      name: req.session.sso_name,
      domain: req.session.domain,
      tenantID: null,
      accessToken: null,
      apiToken: req.session.apiToken
    }
    const ems_creds = {
      name: req.session.ems_name,
      domain: null,
      tenantID: req.session.tenantID,
      accessToken: req.session.accessToken,
      apiToken: null
    }
    await getSubs(orgID, sso_creds, ems_creds)
    await getEmps(orgID, sso_creds)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
