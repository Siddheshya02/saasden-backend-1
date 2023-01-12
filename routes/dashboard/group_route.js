import groupSchema from '../../models/groups.js'
import express from 'express'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const groupData = await groupSchema.find({ ID: req.session.orgID })
    res.json(groupData)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
