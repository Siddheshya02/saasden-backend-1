import { XeroClient } from 'xero-node'
import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()
let xero

// To be called only 1 time
router.post('/auth', async (req, res) => {
  //req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const clientID = req.body.clientID
  const clientSecret = req.body.clientSecret
  const tenantID = req.body.tenantID
  const filter = { ID: req.session.orgID }
  const update = {
    emsData: {
      clientID: clientID,
      clientSecret: clientSecret,
      tenantID: tenantID
    }
  }

  try {
    await orgSchema.findOneAndUpdate(filter, update)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/', async (req, res) => {
  //req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const orgData = await orgSchema.findOne({ ID: req.session.orgID })
  req.session.ems_name = 'xero'
  req.session.ems_clientID = orgData.emsData.clientID
  req.session.ems_clientSecret = orgData.emsData.clientSecret
  req.session.ems_tenantID = orgData.emsData.tenantID
  xero = new XeroClient({
    clientId: req.session.ems_clientID,
    clientSecret: req.session.ems_clientSecret,
    redirectUris: [`${process.env.redirect_URI}-xero`],
    scopes: 'profile email openid accounting.transactions accounting.settings offline_access accounting.contacts'.split(' '),
    state: 'returnPage=my-sweet-dashboard',
    httpTimeout: 3000
  })

  const consentUrl = await xero.buildConsentUrl()
  res.json(consentUrl)
})

router.get('/callback', async (req, res) => {
  console.log('In Xero Callback route')
  try {
    const tokenSet = await xero.apiCallback(req.url)
    req.session.ems_accessToken = tokenSet.access_token
    req.session.ems_IDToken = tokenSet.id_token
    req.session.ems_refreshToken = tokenSet.refresh_token
    console.log('Xero access token received')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
