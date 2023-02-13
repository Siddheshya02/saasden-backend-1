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
    if (!orgData.emsData.tenantID) {
      ssoNames.push(false)
    } else {
      ssoNames.push(true)
    }
    req.session.ssos.push(ssos)
    res.json(ssoNames)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
