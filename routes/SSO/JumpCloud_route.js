import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.post('/auth', async (req, res) => {
  const filter = { name: req.session.orgName }
  const update = {
    ssoData: {
      domain: 'https://console.jumpcloud.com', // jumpcloud domain here
      apiToken: req.body.apiToken // jumpcloud api token here, long lived
    }
  }

  try {
    await orgSchema.findOneAndUpdate(filter, update) // save the domain and api token in the db
    console.log('Jumpcloud Credentials saved succesfully')
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

// this needs to be checked
// router.get('/refreshData', async (req, res) => {
//   try {
//     // fetch SSO Data from the DB
//     const ssoData = await ssoModel.findOne({ saasdenID: req.cookies.saasdenID })
//     await utils.getSubs(ssoData.apiToken, ssoData.saasdenID)
//     await utils.getEmps(ssoData.apiToken, ssoData.saasdenID)
//     res.sendStatus(200)
//   } catch (error) {
//     console.log(error)
//     res.sendStatus(500)
//   }
// })

export { router }
