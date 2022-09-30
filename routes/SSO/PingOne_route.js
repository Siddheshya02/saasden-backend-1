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

// envID not found

/* NOTE: ems/sso _creds object should be passed along like this, irrelevent data should be set to null, name should have name of EMS/SSO
      ems_creds = {
        name,
        domain,
        tenantID,
        accessToken,
        apiToken
      }

      sso_creds = {
        name,
        domain,
        tenantID,
        accessToken,
        apiToken
      }
*/

// This needs to be checked
router.get('/refreshData', async (req, res) => {
  console.log('Fetching Okta Data')
  const ems_creds={
    name:req.session.ems_name,
    domain:undefined,
    tenantID:undefined,
    accessToken:req.session.ems_accessToken,
    apiToken:req.session.ems_IDToken
  }
  const sso_creds = {
    name:undefined,
    domain:req.session.domain,
    tenantID:undefined,
    accessToken:req.session.accessToken,
    apiToken:undefined
  }
  const orgName = req.session.orgName
  // const domain = req.session.sso_domain
  // const apiToken = req.session.sso_apiToken
  try {
    // NOTE: Calling both the functions simultaneously exceeds the okta rate limit
    await getSubs(orgName, sso_creds, ems_creds)
    await getEmps(orgName, sso_creds)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
