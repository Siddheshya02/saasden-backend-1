import express from 'express'
import appDiscoverySchema from '../../models/appDiscovery.js'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const discData = await appDiscoverySchema.findOne({ ID: req.session.orgID })
    res.json(discData)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
