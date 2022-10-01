import { getEmps, getSubs } from '../../JS/SSO/JumpCloud/utils.js'

import express from 'express'
import orgSchema from '../../models/organization.js'
const router = express.Router()

router.post('/auth', async (req, res) => {
  const filter = { name: req.session.orgID }
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

// NOTE: ems/sso _creds object should be passed along like this, irrelevent data should be set to null, name should have name of EMS/SSO

// this needs to be checked
// router.get('/refreshData', async (req, res) => {
//   try {
//     //     // fetch SSO Data from the DB
//     //     remove if not required    //const ssoData = await ssoModel.findOne({ name: req.session.orgID })
//     const sso_creds = {
//       name: req.session.sso_name,
//       domain: null,
//       tenantID: null,
//       accessToken: null,
//       apiToken: req.session.apiToken
//     }
//     const ems_creds = {
//       name: req.session.ems_name,
//       domain: null,
//       tenantID: req.session.tenantID,
//       accessToken: req.session.accessToken,
//       apiToken: null
//     }
//     await getSubs(req.session.orgID, sso_creds, ems_creds)
//     await getEmps(req.session.orgID, sso_creds )
//     res.sendStatus(200)
//   } catch (error) {
//     console.log(error)
//     res.sendStatus(500)
//   }
// })

export { router }
