import express, { json } from 'express'

import { XeroClient } from 'xero-node'
import orgSchema from '../../models/organization.js'

const router = express.Router()
let xero

router.get('/', async (req, res) => {
  const orgData = await orgSchema.find({ name: req.session.orgName })

  // req.session.ems_apiDomain = orgData.emsData.apiDomain
  req.session.ems_clientID = orgData.emsData.clientID
  req.session.ems_clientSecret = orgData.emsData.clientSecret

  xero = new XeroClient({
    clientId: req.session.ems_clientID,
    clientSecret: req.session.ems_clientID,
    redirectUris: [`${process.env.domain}/api/v1/xero/callback`],
    scopes: 'openid profile email accounting.transactions offline_access'.split(' '),
    state: 'returnPage=my-sweet-dashboard', // custom params (optional)
    httpTimeout: 3000 // ms (optional)
  })

  const consentUrl = await xero.buildConsentUrl()
  res.send(json({ redirectUri: consentUrl }))
})

router.get('/callback', async (req, res) => {
  try {
    const tokenSet = await xero.apiCallback(req.url)
    req.session.ems_accessToken = tokenSet.access_token
    req.session.ems_IDToken = tokenSet.id_token
    req.session.ems_refreshToken = tokenSet.refresh_token
    req.session.ems_name='xero'
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

// To be called only 1 time
router.post('/auth', async (req, res) => {
  const clientID = req.body.clientID
  const clientSecret = req.body.clientSecret
  const filter = { name: req.session.orgName }
  const update = {
    emsData: {
      clientID: clientID,
      clientSecret: clientSecret
    }
  }

  try {
    await orgSchema.findOneAndUpdate(filter, update)
    // FIXME: Need to add functionality to accept tenantID
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
