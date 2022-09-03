const express = require('express')
const router = express.Router()

const ssoSchema = require('../../models/sso')
const subSchema = require('../../models/subscription')
const empSchema = require('../../models/employee')

router('/auth', async (req, res) => {
  // need to add a cookie with _id from user schema
  const clientID = req.cookie.user_saasden_id
  const filter = { clientID }
  const update = {
    envID: req.body.envID,
    apiToken: req.body.apiToken
  }
  try {
    await ssoSchema.findOneAndDelete(filter, update)
    console.log('OneLogin Credentials saved succesfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router('/subs', async (req, res) => {
  try {
    const subData = await subSchema.find({ user_saasden_id: req.cookie.user_saasden_id })
    res.send(JSON.stringify(subData))
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router('/emps', async (req, res) => {
  try {
    const empData = await empSchema.find({ user_saasden_id: req.cookie.user_saasden_id })
    res.send(JSON.stringify(empData))
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

module.exports = router
