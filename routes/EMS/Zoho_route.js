import axios from 'axios'
import express from 'express'
import orgSchema from '../../models/organization.js'
const router = express.Router()

// Send Link to Login
router.get('/', async (req, res) => {
  const orgData = await orgSchema.findOne({ ID: req.session.orgID })
  console.log(orgData)
  req.session.ems_clientID = orgData.emsData.clientID
  req.session.ems_clientSecret = orgData.emsData.clientSecret
  console.log(req.session.ems_clientID, req.session.ems_clientSecret)
  // https://accounts.zoho.com/oauth/v2/auth
  const url = new URL('https://accounts.zoho.com/oauth/v2/auth')
  url.searchParams.append('scope', 'ZohoExpense.fullaccess.ALL')
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
    const url = new URL('https://accounts.zoho.in/oauth/v2/token')
    url.searchParams.append('code', req.query.code)
    url.searchParams.append('client_id', '1000.OQ0Q9OQ9YSBI58TY2EAEG5YHNPRWQH')
    url.searchParams.append('client_secret', 'c35f485384a4fdf52077777398c419d18b233d5996')
    url.searchParams.append('redirect_uri', `${process.env.domain}/api/v1/zoho/callback`)
    url.searchParams.append('grant_type', 'authorization_code')
    req.session.clientSecret = 'c35f485384a4fdf52077777398c419d18b233d5996'
    req.session.clientID = '1000.OQ0Q9OQ9YSBI58TY2EAEG5YHNPRWQH'
    console.log(req.session.ems_clientID, req.session.ems_clientSecret)
    const tokenSet = await axios.post(url.toString(), {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      }
    })
    req.session.ems_accessToken = tokenSet.data.access_token
    req.session.ems_refreshToken = tokenSet.data.refresh_token
    req.session.ems_name = 'zoho'
    console.log(req.session.ems_accessToken, req.session.ems_refreshToken)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

// To be called only 1 time
router.post('/auth', async (req, res) => {
  req.session.orgID = 'org_sad78dsfbsdbfs'
  const filter = { ID: req.session.orgID } // have to set orgName in session in app.js
  const update = {
    emsData: {
      clientID: req.body.clientID,
      clientSecret: req.body.clientSecret
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
