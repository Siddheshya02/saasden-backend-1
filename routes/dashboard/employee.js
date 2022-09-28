import empSchema from '../../models/employee.js'
import express from 'express'
const router = express.Router()

router.get('/emps', async (req, res) => {
  try {
    const empData = await empSchema.find({ saasdenID: req.cookies.saasdenID })
    res.json(empData)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
