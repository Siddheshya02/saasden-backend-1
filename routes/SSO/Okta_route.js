import { getEmps, getSubs } from '../../JS/SSO/Okta/utils.js'

import express from 'express'
import orgSchema from '../../models/organization.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    req.session.domain = orgData.ssoData.domain
    // console.log("data ",orgData.ssoData)
    req.session.apiToken = orgData.ssoData.apiToken
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
      domain: req.body.domain, // okta domain here
      apiToken: req.body.apiToken // okta api token here, long lived
    }
  }
  req.session.domain = req.body.domain
  // console.log("domain",req.body.domain);
  req.session.apiToken = req.body.apiToken
  // console.log("domain",req.body.apiToken);
  try {
    await orgSchema.findOneAndUpdate(filter, update) // save the domain and api token in the db
    console.log('Okta Credentials saved succesfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/refreshData', async (req, res) => {
  console.log('Fetching Okta Data')
  try {
    // NOTE: Calling both the functions simultaneously exceeds the okta rate limit
    const sso_creds = {
      name: req.session.sso_name,
      domain: req.session.domain,
      tenantID: null,
      accessToken: null,
      apiToken: req.session.apiToken
    }
    const ems_creds = {
      name: 'xero',
    domain: null,
    tenantID: '61608321-d0a3-408f-9e5a-98cba0de0fee',
    accessToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFDQUY4RTY2NzcyRDZEQzAyOEQ2NzI2RkQwMjYxNTgxNTcwRUZDMTkiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJISy1PWm5jdGJjQW8xbkp2MENZVmdWY09fQmsifQ.eyJuYmYiOjE2NjQ3MTE5MjIsImV4cCI6MTY2NDcxMzcyMiwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS54ZXJvLmNvbSIsImF1ZCI6Imh0dHBzOi8vaWRlbnRpdHkueGVyby5jb20vcmVzb3VyY2VzIiwiY2xpZW50X2lkIjoiQ0ExMkMyMjU2MTI0NDI1NkE1NzIxRjgyQ0JBODBFNTIiLCJzdWIiOiI4OTIyNDVkNzBiNDM1ZGEzOTE2YTI3MDQwMjczOTRhOCIsImF1dGhfdGltZSI6MTY2NDY4OTc2OSwieGVyb191c2VyaWQiOiJkOGEwZTY2Zi0xNmYxLTRhMDctYmY1Yi01NTE4OTBiNGJlM2MiLCJnbG9iYWxfc2Vzc2lvbl9pZCI6IjdiMDYwNTUyZTJjMjQwZmNhZDA3YjllZmY4ZGQzNzM4IiwianRpIjoiNTJDNjA3MjBGMUVDNDI1RDFFMTYzNTg5Mjk0MUU4MDMiLCJhdXRoZW50aWNhdGlvbl9ldmVudF9pZCI6ImYyMzNkNjNlLTZhMzgtNGIwZC05NmE0LTIzNjliZjIzN2I4ZiIsInNjb3BlIjpbImVtYWlsIiwicHJvZmlsZSIsIm9wZW5pZCIsImFjY291bnRpbmcuc2V0dGluZ3MiLCJhY2NvdW50aW5nLnRyYW5zYWN0aW9ucyIsImFjY291bnRpbmcudHJhbnNhY3Rpb25zLnJlYWQiLCJhY2NvdW50aW5nLmNvbnRhY3RzIiwib2ZmbGluZV9hY2Nlc3MiXSwiYW1yIjpbInB3ZCJdfQ.gx8FvO2jk_p6VHtnLI39X-lNxvf4Nnzep7KHk6NW67cqinU3YL82xARiFr9KBdvb-XkctObU_Fm6WLjyZp5hcmezqFtzxeLyed2rj0nq3PFqlqWGuVR0y0BiOT3E0rTSMd1yVmrXUGFh-p3SfEuc1GVmnc-xQ2glQIdUHy-y8AYbwz-4sV4WBFsFkxQSaQVcjOacxrQ9PxpMfZLPfb5RTzeQ61VAMnsvcJ8qxVinULmbF7y3Vaq9uSVgtESLRqlS4gnjCj2hNApBA8D03kBQNLuKbiLW8rXRysfffKwCgBarqy8MYXduUGG2hPOBgBsjYmd2z_qZ0IzPkkudcUjZYg',
    apiToken: null
    }
    await getSubs(req.session.orgID, sso_creds, ems_creds)
    await getEmps(req.session.orgID, sso_creds)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
