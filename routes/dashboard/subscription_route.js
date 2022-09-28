import express from 'express'
import subSchema from '../../models/subscription.js'
const router = express.Router()

router.get('/subs', async (req, res) => {
  try {
    const subData = await subSchema.findOne({ name: req.session.orgName })
    res.json(subData)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
