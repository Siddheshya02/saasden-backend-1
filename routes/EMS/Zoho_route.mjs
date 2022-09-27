import axios from 'axios'
import orgSchema from '../../models/organization'
const express = require('express')
const router = express.Router()

// Send Link to Login
router.get('/', async (req, res) => {
  const orgData = await orgSchema.find({ name: req.session.orgName })

  req.session.ems_apiDomain = orgData.emsData.apiDomain
  req.session.ems_clientID = orgData.emsData.clientID
  req.session.ems_clientSecret = orgData.emsData.clientSecret

  const url = new URL(`${req.session.ems_apiDomain}/oauth/v2/auth`)
  url.searchParams.append('scope', 'ZohoExpense.expensereport.READ')
  url.searchParams.append('client_id', req.session.ems_clientID)
  url.searchParams.append('state', 'radomState=usedforSecuRity')
  url.searchParams.append('response_type', 'code')
  url.searchParams.append('redirect_uri', `${process.env.domain}/api/v1/zoho/callback`)
  url.searchParams.append('access_type', 'offline')
  url.searchParams.append('prompt', 'consent')
  res.send(url.toString())
})

router.get('/callback', async (req, res) => {
  try {
    const url = new URL(`${req.session.ems_apiDomain}/oauth/v2/token`)
    url.searchParams.append('code', req.query.code)
    url.searchParams.append('client_id', req.session.ems_clientID)
    url.searchParams.append('client_secret', req.session.ems_clientSecret)
    url.searchParams.append('redirect_uri', `${process.env.domain}/api/v1/zoho/callback`)
    url.searchParams.append('grant_type', 'authorization_code')
    const tokenSet = await axios.post(url.toString(), {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      }
    }).data
    req.session.ems_accessToken = tokenSet.access_token
    req.session.ems_IDToken = tokenSet.id_token
    req.session.apiDomain = tokenSet.apiDomain
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

// To be called only 1 time
router.get('/auth', async (req, res) => {
  const filter = { name: req.session.orgName } // have to set orgName in session in app.js
  const update = {
    emsData: {
      clientID: req.body.clientID,
      clientSecret: req.body.clientSecret
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

module.exports = router
