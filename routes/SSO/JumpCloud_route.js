import express from 'express'
import orgSchema from '../../models/organization.js'
import { createUser } from '../../JS/SSO/JumpCloud/utils.js'
const router = express.Router()

router.post('/auth', async (req, res) => {
  // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const filter = { ID: req.session.orgID }
  const ssoData = {
    ssoName: 'jumpcloud',
    clientID: null,
    clientSecret: null,
    tenantID: null,
    domain: null,
    apiToken: req.body.apiToken
  }
  const initialData = await orgSchema.findOne(filter)
  let initialSSos
  if (!initialData.ssoData) {
    initialSSos = []
  } else {
    initialSSos = initialData.ssoData
  }
  let checkPresence = false
  for (const sso of initialSSos) {
    // eslint-disable-next-line eqeqeq
    if (sso.ssoName == 'jumpcloud') {
      checkPresence = true
      break
    }
  }
  if (!checkPresence) {
    initialSSos.push(ssoData)
  } else {
    console.log('SSO present in db')
  }
  const update = {
    ssoData: initialSSos
  }
  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('Jumpcloud Credentials saved succesfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/', async (req, res) => {
  try {
    // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    const ssos = orgData.ssoData
    let checkPresence = false
    for (const sso of req.session.ssos) {
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'jumpcloud') {
        checkPresence = true
      }
    }
    for (const sso of ssos) {
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'jumpcloud') {
        if (!checkPresence) {
          req.session.ssos.push(sso)
        }
        break
      }
    }
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})
router.post('/createUser', async (req, res) => {
  // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const user = req.body
  console.log('user ', user)
  console.log('Request : ', req)
  try {
    for (const sso of req.session.ssos) {
      // console.log(sso)
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'jumpcloud') {
        console.log('hit')
      // await createUser(sso, user)
      }
    }
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})
export { router }
