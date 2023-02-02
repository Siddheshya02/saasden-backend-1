import orgSchema from '../../models/organization.js'
import express from 'express'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.find({ ID: req.session.orgID })
    if (orgData.ssoData != null && orgData.ssoData.length > 0) {
      res.sendStatus(200)
    } else {
      res.sendStatus(201)
    }
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
