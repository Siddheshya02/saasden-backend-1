import axios from 'axios'
import express from 'express'
import orgSchema from '../../models/organization.js'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.find({ name: req.session.orgID })
    req.session.sso_tenantID = orgData.ssoData.tenantID
    req.session.sso_clientID = orgData.ssoData.clientID
    req.session.sso_clientSecret = orgData.ssoData.clientSecret

    const tokenSet = await axios.post(`https://${req.session.sso_apiDomain}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: `${req.session.sso_clientID}`,
        scope: `${req.session.sso_apiDomain}`,
        client_secret: `${req.session.sso_clientSecret}`,
        grant_type: 'client_credentials'
      })
    )

    req.session.sso_accessToken = tokenSet.access_token // access token
    // req.session.sso_refreshToken = tokenSet.refresh_token // refresh token

    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.post('/auth', async (req, res) => {
  const filter = { name: req.session.orgID }
  const update = {
    ssoData: {
      clientID: req.body.clientID,
      clientSecret: req.body.clientSecret,
      tenantID: req.body.tenantID
    }
  }

  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('Azure credentials saved successfully')
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

/* NOTE: ems/sso _creds object should be passed along like this, irrelevent data should be set to undefined, name should have name of EMS/SSO
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
    domain:undefined,
    tenantID:undefined,
    accessToken:req.session.sso_accessToken,
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
