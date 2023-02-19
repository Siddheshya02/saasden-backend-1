import orgSchema from '../../models/organization.js'
import express from 'express'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    const ssos = orgData.ssoData
    const ssoNames = []
    for (let i = 0; i < orgData.ssoData.length; i++) {
      ssoNames.push(orgData.ssoData[i].ssoName)
    }
    if (orgData.emsData.tenantID) {
      ssoNames.push('xero')
      ssoNames.push('zoho')
    }
    for (const sso of ssos) {
      req.session.ssos.push(sso)
    }
    res.json(ssoNames)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
