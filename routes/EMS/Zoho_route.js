import axios from 'axios'
import express from 'express'
import orgSchema from '../../models/organization.js'
const router = express.Router()

// To be called only 1 time
router.post('/auth', async (req, res) => {
  const filter = { ID: req.session.orgID }
  const update = {
    emsData: {
      clientID: req.body.clientID,
      clientSecret: req.body.clientSecret,
      tenantID: req.body.tenantID
    }
  }
  req.session.ems_accessToken = '1000.88a2f91899a66a23e480f9a0bc0673ab.6afafecd85df4d49a46dd8fb97e0b220'
  req.session.ems_tenantID = '60017656360'
  req.session.ems_name = 'zoho'
  try {
    await orgSchema.findOneAndUpdate(filter, update)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

// Send Link to Login
router.get('/', async (req, res) => {
  // const orgData = await orgSchema.findOne({ ID: req.session.orgID })
  // req.session.ems_name = 'zoho'
  // req.session.ems_clientID = orgData.emsData.clientID
  // req.session.ems_clientSecret = orgData.emsData.clientSecret
  // req.session.ems_tenantID = orgData.emsData.tenantID
  // const url = new URL('https://accounts.zoho.com/oauth/v2/auth')
  // url.searchParams.append('scope', 'ZohoExpense.fullaccess.ALL')
  // url.searchParams.append('client_id', req.session.ems_clientID)
  // url.searchParams.append('state', 'radomState=usedforSecuRity')
  // url.searchParams.append('response_type', 'code')
  // url.searchParams.append('redirect_uri', `${process.env.redirect_URI}-zoho`)
  // url.searchParams.append('access_type', 'offline')
  // url.searchParams.append('prompt', 'consent')
  // res.json(url.toString())
  res.redirect('/callback')
})

router.get('/callback', async (req, res) => {
  console.log('In Zoho callback route')
  try {
    // const url = new URL('https://accounts.zoho.in/oauth/v2/token')
    // url.searchParams.append('code', req.query.code)
    // url.searchParams.append('client_id', req.session.ems_clientID)
    // url.searchParams.append('client_secret', req.session.ems_clientSecret)
    // url.searchParams.append('redirect_uri', `${process.env.redirect_URI}-zoho`)
    // url.searchParams.append('grant_type', 'authorization_code')
    // const tokenSet = await axios.post(url.toString(), {
    //   headers: {
    //     'Content-type': 'application/x-www-form-urlencoded'
    //   }
    // })
    // // req.session.ems_accessToken = tokenSet.data.access_token
    // req.session.ems_accessToken = '1000.88a2f91899a66a23e480f9a0bc0673ab.6afafecd85df4d49a46dd8fb97e0b220'
    // req.session.ems_refreshToken = tokenSet.data.refresh_token
    console.log(req.session)
    console.log('Zoho Access Token Received')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
