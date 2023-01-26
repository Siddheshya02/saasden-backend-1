import axios from 'axios'
import base64 from 'nodejs-base64-converter'
import express from 'express'
import orgSchema from '../../models/organization.js'
import url from 'url'

const router = express.Router()

router.post('/auth', async (req, res) => {
  req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const filter = { ID: req.session.orgID }
  // const update = {
  //   ssoData: {
  //     domain: req.body.domain,
  //     tenantID: req.body.tenantID,
  //     clientID: req.body.clientID,
  //     clientSecret: req.body.clientSecret
  //   }
  // }
  const ssoData = {
    ssoName: 'pingone',
    clientID: req.body.clientID,
    clientSecret: req.body.clientSecret,
    tenantID: req.body.tenantID,
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
    if (sso.ssoName == 'pingone') {
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
    console.log('PingOne Data received')
    await orgSchema.findOneAndUpdate(filter, update)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/', async (req, res) => {
  try {
    req.session.orgID = 'org_qEHnRrdOzNUwWajN'
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    // req.session.sso_name = 'pingone'
    // req.session.sso_domain = orgData.ssoData.domain
    // req.session.sso_clientID = orgData.ssoData.clientID
    // req.session.sso_clientSecret = orgData.ssoData.clientSecret
    // req.session.sso_tenantID = orgData.ssoData.tenantID
    // console.log(req.session)
    // console.log(orgData)
    const ssos = orgData.ssoData
    let tenantID
    let client_id
    let client_secret
    let domain
    let checkPresence = false
    for (const sso of req.session.ssos) {
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'pingone') {
        checkPresence = true
      }
    } for (const sso of ssos) {
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'pingone') {
        console.log(sso)
        tenantID = sso.tenantID
        client_id = sso.clientID
        client_secret = sso.clientSecret
        domain = sso.domain
        if (!checkPresence) {
          sso.access_token = null
          const client_creds = base64.encode(`${client_id}:${client_secret}`)
          const params = new url.URLSearchParams({ grant_type: 'client_credentials' })
          const tokenSet = await axios.post(`https://auth.${domain}/${tenantID}/as/token`, params.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${client_creds}`
            }
          })
          // req.session.sso_accessToken = tokenSet.data.access_token
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
    console.log('Pingone access token recieved')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
