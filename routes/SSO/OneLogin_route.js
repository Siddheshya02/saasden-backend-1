import axios from 'axios'
import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.post('/auth', async (req, res) => {
  req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const filter = { ID: req.session.orgID }
  // const update = {
  //   ssoData: {
  //     clientID: req.body.clientID,
  //     clientSecret: req.body.clientSecret,
  //     domain: req.body.domain
  //   }
  // }
  const ssoData = {
    ssoName: 'onelogin',
    clientID: req.body.clientID,
    clientSecret: req.body.clientSecret,
    tenantID: null,
    domain: req.body.domain,
    apiToken: null
  }
  const initialData = await orgSchema.findOne(filter)
  let initialSSos
  if (!initialData.ssoData) {
    initialSSos = []
  } else {
    initialSSos = initialData.ssoData
  }
  let checkPresence = false
  for (const sso of initialSSos) {
    // eslint-disable-next-line eqeqeq
    if (sso.ssoName == 'onelogin') {
      checkPresence = true
    }
  }
  if (!checkPresence) {
    initialSSos.push(ssoData)
  } else {
    console.log('SSO present in database')
  }
  const update = {
    ssoData: initialSSos
  }
  // console.log(req.session)
  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('OneLogin credentials saved successfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/', async (req, res) => {
  try {
    // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    const ssos = orgData.ssoData
    let domain
    let client_id
    let client_secret
    let checkPresence = false
    for (const sso of req.session.ssos) {
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'onelogin') {
        checkPresence = true
      }
    }
    for (const sso of ssos) {
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'onelogin') {
        domain = sso.domain
        client_id = sso.clientID
        client_secret = sso.clientSecret
        if (!checkPresence) {
          sso.access_token = null
          sso.refresh_token = null
          const tokenSet = await axios.post(`https://${domain}/auth/oauth2/v2/token`, {
            client_id: client_id,
            client_secret: client_secret,
            grant_type: 'client_credentials'
          }, {
            'Content-Type': 'application/x-www-form-urlencoded'
          })
          const updatedSso = {
            ssoName: sso.ssoName,
            clientID: sso.clientID,
            clientSecret: sso.clientSecret,
            tenantID: null,
            domain: sso.domain,
            apiToken: null,
            access_token: tokenSet.data.access_token,
            refresh_token: tokenSet.data.refresh_token
          }
          console.log(updatedSso)
          req.session.ssos.push(updatedSso)
        }
        break
      }
    }
    console.log('One login access token recieved')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
