/* eslint-disable no-useless-return */
import axios from 'axios'
import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.post('/auth', async (req, res) => {
  // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const filter = { ID: req.session.orgID }
  // const update = {
  //   ssoData: {
  //     clientID: req.body.clientID,
  //     clientSecret: req.body.clientSecret,
  //     tenantID: req.body.tenantID
  //   }
  // }
  const ssoData = {
    ssoName: 'azure',
    clientID: req.body.clientID,
    clientSecret: req.body.clientSecret,
    tenantID: req.body.tenantID,
    domain: null,
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
    if (sso.ssoName == 'azure') {
      checkPresence = true
      break
    }
  }
  if (!checkPresence) {
    initialSSos.push(ssoData)
  } else {
    console.log('SSO present in db')
  }
  const update = {
    ssoData: initialSSos
  }

  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('Azure Credentials saved succesfully')
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
    // req.session.sso_name = 'azure'
    // req.session.sso_tenantID = orgData.ssoData.tenantID
    // req.session.sso_clientID = orgData.ssoData.clientID
    // req.session.sso_clientSecret = orgData.ssoData.clientSecret
    const ssos = orgData.ssoData
    let tenantID
    let client_id
    let client_secret
    let checkPresence = false
    for (const sso of req.session.ssos) {
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'azure') {
        checkPresence = true
      }
    } for (const sso of ssos) {
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'azure') {
        console.log(sso)
        tenantID = sso.tenantID
        client_id = sso.clientID
        client_secret = sso.clientSecret
        if (!checkPresence) {
          sso.access_token = null
          sso.refresh_token = null
          const tokenSet = await axios.post(`https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/token`,
            new URLSearchParams({
              client_id: `${client_id}`,
              scope: 'https://graph.microsoft.com/.default',
              client_secret: `${client_secret}`,
              grant_type: 'client_credentials'
            })
          ).then(res => { return res.data }).catch(res => console.log(res))
          // console.log(tokenSet)

          const updatedSso = {
            ssoName: sso.ssoName,
            clientID: sso.clientID,
            clientSecret: sso.clientSecret,
            tenantID: sso.tenantID,
            domain: null,
            apiToken: null,
            access_token: tokenSet.access_token,
            refresh_token: null
          }
          console.log(updatedSso)
          req.session.ssos.push(updatedSso)
        }
        break
      }
    }
    // req.session.sso_accessToken = tokenSet.access_token // access token
    console.log('Azure Access Token recieved', req.session.ssos)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
