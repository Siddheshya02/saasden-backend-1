import axios from 'axios'
import { getSubs, getEmps } from '../../JS/SSO/Azure/utils.js'
import express from 'express'
import orgSchema from '../../models/organization.js'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    req.session.sso_tenantID = orgData.ssoData.tenantID
    req.session.sso_clientID = orgData.ssoData.clientID
    req.session.sso_clientSecret = orgData.ssoData.clientSecret
    // console.log("tenantId",orgData.ssoData.tenantID)
    const tokenSet = await axios.post(`https://login.microsoftonline.com/${req.session.sso_tenantID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: `${req.session.sso_clientID}`,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: `${req.session.sso_clientSecret}`,
        grant_type: 'client_credentials'
      })
    ).then(res => { return res.data.access_token }).catch(res => console.log(res))

    req.session.sso_accessToken = tokenSet // access token
    // req.session.sso_refreshToken = tokenSet.refresh_token // refresh token

    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.post('/auth', async (req, res) => {
  req.session.orgID = 'org_ioaseunclsd'
  const filter = { ID: req.session.orgID }
  const update = {
    ssoData: {
      clientID: req.body.clientID,
      clientSecret: req.body.clientSecret,
      tenantID: req.body.tenantID
    }
  }
  req.session.sso_tenantID = req.body.tenantID
  req.session.sso_clientID = req.body.clientID
  req.session.sso_clientSecret = req.body.clientSecret
  // console.log("tenantiD",req.body.tenantID)

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
  console.log('Fetching Azure Data')
  const ems_creds = {
    name: 'xero',
    domain: null,
    tenantID: '61608321-d0a3-408f-9e5a-98cba0de0fee',
    accessToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFDQUY4RTY2NzcyRDZEQzAyOEQ2NzI2RkQwMjYxNTgxNTcwRUZDMTkiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJISy1PWm5jdGJjQW8xbkp2MENZVmdWY09fQmsifQ.eyJuYmYiOjE2NjQ3MTE5MjIsImV4cCI6MTY2NDcxMzcyMiwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS54ZXJvLmNvbSIsImF1ZCI6Imh0dHBzOi8vaWRlbnRpdHkueGVyby5jb20vcmVzb3VyY2VzIiwiY2xpZW50X2lkIjoiQ0ExMkMyMjU2MTI0NDI1NkE1NzIxRjgyQ0JBODBFNTIiLCJzdWIiOiI4OTIyNDVkNzBiNDM1ZGEzOTE2YTI3MDQwMjczOTRhOCIsImF1dGhfdGltZSI6MTY2NDY4OTc2OSwieGVyb191c2VyaWQiOiJkOGEwZTY2Zi0xNmYxLTRhMDctYmY1Yi01NTE4OTBiNGJlM2MiLCJnbG9iYWxfc2Vzc2lvbl9pZCI6IjdiMDYwNTUyZTJjMjQwZmNhZDA3YjllZmY4ZGQzNzM4IiwianRpIjoiNTJDNjA3MjBGMUVDNDI1RDFFMTYzNTg5Mjk0MUU4MDMiLCJhdXRoZW50aWNhdGlvbl9ldmVudF9pZCI6ImYyMzNkNjNlLTZhMzgtNGIwZC05NmE0LTIzNjliZjIzN2I4ZiIsInNjb3BlIjpbImVtYWlsIiwicHJvZmlsZSIsIm9wZW5pZCIsImFjY291bnRpbmcuc2V0dGluZ3MiLCJhY2NvdW50aW5nLnRyYW5zYWN0aW9ucyIsImFjY291bnRpbmcudHJhbnNhY3Rpb25zLnJlYWQiLCJhY2NvdW50aW5nLmNvbnRhY3RzIiwib2ZmbGluZV9hY2Nlc3MiXSwiYW1yIjpbInB3ZCJdfQ.gx8FvO2jk_p6VHtnLI39X-lNxvf4Nnzep7KHk6NW67cqinU3YL82xARiFr9KBdvb-XkctObU_Fm6WLjyZp5hcmezqFtzxeLyed2rj0nq3PFqlqWGuVR0y0BiOT3E0rTSMd1yVmrXUGFh-p3SfEuc1GVmnc-xQ2glQIdUHy-y8AYbwz-4sV4WBFsFkxQSaQVcjOacxrQ9PxpMfZLPfb5RTzeQ61VAMnsvcJ8qxVinULmbF7y3Vaq9uSVgtESLRqlS4gnjCj2hNApBA8D03kBQNLuKbiLW8rXRysfffKwCgBarqy8MYXduUGG2hPOBgBsjYmd2z_qZ0IzPkkudcUjZYg',
    apiToken: null
  }
  const sso_creds = {
    name: undefined,
    domain: undefined,
    tenantID: req.session.tenantID,
    accessToken: req.session.sso_accessToken,
    apiToken: undefined
  }
  const orgID = req.session.orgID
  console.log(req.session.sso_accessToken)
  // const domain = req.session.sso_domain
  // const apiToken = req.session.sso_apiToken
  try {
    // NOTE: Calling both the functions simultaneously exceeds the okta rate limit
    await getSubs(orgID, sso_creds, ems_creds)
    await getEmps(orgID, sso_creds)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
