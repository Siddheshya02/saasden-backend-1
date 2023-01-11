import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.post('/auth', async (req, res) => {
  const filter = { ID: req.session.orgID }

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

router.get('/', async (req, res) => {
  try {
    req.session.orgID = 'org_qEHnRrdOzNUwWajN'
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    req.session.sso_name = 'okta'
    req.session.sso_domain = orgData.ssoData.domain
    req.session.sso_apiToken = orgData.ssoData.apiToken
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
