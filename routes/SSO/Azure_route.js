import axios from 'axios'
import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

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

  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('Azure credentials saved successfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    req.session.sso_name = 'azure'
    req.session.sso_tenantID = orgData.ssoData.tenantID
    req.session.sso_clientID = orgData.ssoData.clientID
    req.session.sso_clientSecret = orgData.ssoData.clientSecret
    const tokenSet = await axios.post(`https://login.microsoftonline.com/${req.session.sso_tenantID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: `${req.session.sso_clientID}`,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: `${req.session.sso_clientSecret}`,
        grant_type: 'client_credentials'
      })
    ).then(res => { return res.data }).catch(res => console.log(res))
    req.session.sso_accessToken = tokenSet.access_token // access token
    console.log('Azure Access Token recieved')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
