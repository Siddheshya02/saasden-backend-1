import axios from 'axios'
import base64 from 'nodejs-base64-converter'
import express from 'express'
import orgSchema from '../../models/organization.js'
import url from 'url'

const router = express.Router()

router.post('/auth', async (req, res) => {
  const filter = { ID: req.session.orgID }
  const update = {
    ssoData: {
      domain: req.body.domain,
      tenantID: req.body.tenantID,
      clientID: req.body.clientID,
      clientSecret: req.body.clientSecret
    }
  }

  try {
    console.log('PingOne Data received')
    await orgSchema.findOneAndUpdate(filter, update)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    req.session.sso_name = 'pingone'
    req.session.sso_domain = orgData.ssoData.domain
    req.session.sso_clientID = orgData.ssoData.clientID
    req.session.sso_clientSecret = orgData.ssoData.clientSecret
    req.session.sso_tenantID = orgData.ssoData.tenantID

    const client_creds = base64.encode(`${orgData.ssoData.clientID}:${orgData.ssoData.clientSecret}`)
    const params = new url.URLSearchParams({ grant_type: 'client_credentials' })
    const tokenSet = await axios.post(`https://auth.${req.session.sso_domain}/${req.session.sso_tenantID}/as/token`, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${client_creds}`
      }
    })
    req.session.sso_accessToken = tokenSet.data.access_token
    console.log('Pingone access token recieved')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
