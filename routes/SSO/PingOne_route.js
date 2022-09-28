import axios from 'axios'
import base64 from 'nodejs-base64-converter'
import express from 'express'
import orgSchema from '../../models/organization.js'
import url from 'url'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.find({ name: req.session.orgName })
    req.session.domain = orgData.ssoData.domain

    const client_creds = base64.encode(`${orgData.ssoData.clientID}:${orgData.ssoData.clientSecret}`)
    const params = new url.URLSearchParams({ grant_type: 'client_credentials' })
    const tokenSet = await axios.post(`${req.session.domain}/as/token`, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${client_creds}`
      }
    })
    req.session.accessToken = tokenSet.access_token
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.post('/auth', async (req, res) => {
  const filter = { name: req.session.orgName }
  const update = {
    ssoData: {
      domain: req.body.domain, // pingone domain here
      clientID: req.body.clientID,
      clientSecret: req.body.clientSecret
    }
  }

  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('Ping Credentials saved succesfully')
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

// This needs to be checked
// router.get('/refreshData', async (req, res) => {
//   try {
//     // fetch SSO Data from the DB
//     const ssoData = await ssoModel.findOne({ saasdenID: req.cookies.saasdenID })
//     await utils.getSubs(ssoData.envID, ssoData.apiToken, ssoData.saasdenID)
//     await utils.getEmps(ssoData.envID, ssoData.apiToken, ssoData.saasdenID)
//     res.sendStatus(200)
//   } catch (error) {
//     console.log(error)
//     res.sendStatus(500)
//   }
// })

export { router }
