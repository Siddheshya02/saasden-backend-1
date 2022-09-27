import orgSchema from '../../models/organization'
import express from 'express'

const router = express.Router()

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

module.exports = router
