import orgSchema from '../../models/organization.js'
import express from 'express'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const orgData = await orgSchema.find({ ID: req.session.orgID })
    res.json(orgData)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
