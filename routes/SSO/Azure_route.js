import axios from 'axios'
import express from 'express'
import orgSchema from '../../models/organization.js'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.find({ name: req.session.orgName })
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
  const filter = { name: req.session.orgName }
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

// router.get('/refreshData', async (req, res) => {
//   try {
//     // fetch SSO Data from the DB
//     const ssoData = await ssoModel.findOne({ saasdenID: req.cookies.saasdenID })
//     const accessToken = await utils.getToken(ssoData.clientID, ssoData.clientSecret, ssoData.tenantId)
//     await utils.getSubs(accessToken, ssoData.saasdenID)
//     await utils.getEmps(accessToken, ssoData.saasdenID)
//     res.sendStatus(200)
//   } catch (error) {
//     console.log(error)
//     res.sendStatus(500)
//   }
// })

export { router }
