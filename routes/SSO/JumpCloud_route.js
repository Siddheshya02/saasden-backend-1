import { getEmps, getSubs } from '../../JS/SSO/JumpCloud/utils.js'

import express from 'express'
import orgSchema from '../../models/organization.js'

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

router.get('/refreshData', async (req, res) => {
  try {
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
