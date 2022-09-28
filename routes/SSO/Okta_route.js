import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.find({ name: req.session.orgName })
    req.session.domain = orgData.ssoData.ssoName
    req.session.apiToken = orgData.ssoData.apiToken
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
      domain: req.body.domain, // okta domain here
      apiToken: req.body.apiToken // okta api token here, long lived
    }
  }

  try {
    await orgSchema.findOneAndUpdate(filter, update) // save the domain and api token in the db
    console.log('Okta Credentials saved succesfully')
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

// this needs to be check
// router.get('/refreshData', async (req, res) => {
//   console.log('Fetching Okta Data')
//   try {
//     // fetch SSO Data from the DB
//     const ssoData = await ssoModel.findOne({ saasdenID: req.cookies.saasdenID })
//     // Rate limit exceeded here
//     await utils.getSubs(ssoData.domain, ssoData.apiToken, ssoData.saasdenID)
//     // await utils.getEmps(ssoData.domain, ssoData.apiToken, ssoData.saasdenID)
//     res.sendStatus(200)
//   } catch (error) {
//     console.log(error)
//     res.sendStatus(500)
//   }
// })

export { router }
