import axios from 'axios'
import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.post('/auth', async (req, res) => {
  const filter = { ID: req.session.orgID }
  const update = {
    ssoData: {
      clientID: req.body.clientID,
      clientSecret: req.body.clientSecret,
      domain: req.body.domain
    }
  }

  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('OneLogin credentials saved successfully')
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
    req.session.sso_name = 'onelogin'
    req.session.sso_domain = orgData.ssoData.domain
    req.session.sso_clientID = orgData.ssoData.clientID
    req.session.sso_clientSecret = orgData.ssoData.clientSecret

    const tokenSet = await axios.post(`https://${req.session.sso_domain}/auth/oauth2/v2/token`, {
      client_id: req.session.sso_clientID,
      client_secret: req.session.sso_clientSecret,
      grant_type: 'client_credentials'
    }, {
      'Content-Type': 'application/x-www-form-urlencoded'
    })
    req.session.sso_accessToken = tokenSet.data.access_token // access token
    req.session.sso_refreshToken = tokenSet.data.refresh_token // refresh token
    console.log('One login access token recieved')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
