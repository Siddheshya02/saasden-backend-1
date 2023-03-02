import express from 'express'
import orgSchema from '../../models/organization.js'
import { addUserToGroup, createUser, deleteApp, deleteUser, deleteUserFromApp, deleteUserFromGroup } from '../../JS/SSO/Okta/utils.js'
const router = express.Router()

router.post('/auth', async (req, res) => {
  // req.session.destroy()
  // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const filter = { ID: req.session.orgID }

  // const update = {
  //   ssoData: {
  //     domain: req.body.domain,
  //     apiToken: req.body.apiToken
  //   }
  // }
  const ssoData = {
    ssoName: 'okta',
    clientID: null,
    clientSecret: null,
    tenantID: null,
    domain: req.body.domain,
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
    if (sso.ssoName == 'okta') {
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
  console.log(req.session)
  try {
    await orgSchema.findOneAndUpdate(filter, update)
    console.log('Okta Credentials saved succesfully')
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
      if (sso.ssoName == 'okta') {
        checkPresence = true
      }
    }
    for (const sso of ssos) {
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'okta') {
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
router.get('/destroy', (req, res) => {
  req.session.destroy()
  res.sendStatus(200)
})

// createuser

router.post('/createUser', async (req, res) => {
  // // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const user = req.body
  console.log('user ', user)
  try {
    for (const sso of req.session.ssos) {
      console.log(sso)
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'okta') {
        console.log('hit')
        await createUser(sso, user)
      }
    }
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.post('/deleteUser', async (req, res) => {
  // // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const user = req.body
  console.log('user ', user)
  try {
    for (const sso of req.session.ssos) {
      console.log(sso)
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'okta') {
        console.log('hit')
        await deleteUser(sso, user)
      }
    }
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.post('/groups/addUser', async (req, res) => {
  // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const userInfo = req.body.userInfo
  const grpInfo = req.body.grpInfo
  // console.log('Request : ', req)
  try {
    for (const sso of req.session.ssos) {
      // console.log(sso)
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'okta') {
        console.log('hit')
        await addUserToGroup(sso, userInfo, grpInfo)
      }
    }
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.post('/groups/deleteUser', async (req, res) => {
  // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const userInfo = req.body.userInfo
  const grpInfo = req.body.grpInfo
  // console.log('Request : ', req)
  try {
    for (const sso of req.session.ssos) {
      // console.log(sso)
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'okta') {
        console.log('hit')
        await deleteUserFromGroup(sso, userInfo, grpInfo)
      }
    }
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.post('/app/delete', async (req, res) => {
  // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  // const userInfo = req.body.userInfo
  const appInfo = req.body.appInfo
  // console.log('Request : ', req)
  try {
    for (const sso of req.session.ssos) {
      // console.log(sso)
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'okta') {
        console.log('hit')
        await deleteApp(sso, appInfo)
      }
    }
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.post('/app/deleteUser', async (req, res) => {
  // req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const userInfo = req.body.userInfo
  const appInfo = req.body.appInfo
  // console.log('Request : ', req)
  try {
    for (const sso of req.session.ssos) {
      // console.log(sso)
      // eslint-disable-next-line eqeqeq
      if (sso.ssoName == 'okta') {
        console.log('hit')
        await deleteUserFromApp(sso, userInfo, appInfo)
      }
    }
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
