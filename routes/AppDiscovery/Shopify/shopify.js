import express from 'express'
// import orgSchema from '../../models/organization.js'
import appDiscoverySchema from '../../../models/appDiscovery.js'
import { getScriptTags } from '../../../JS/AppDiscovery/Shopify/utils.js'

const router = express.Router()

router.post('/auth', async (req, res) => {
  req.session.orgID = 'org_qEHnRrdOzNUwWajN'
  const filter = { ID: req.session.orgID }
  // const update = {
  //   ssoData: {
  //     apiToken: req.body.apiToken
  //   }
  // }
  const discovery = {
    discName: req.body.name,
    url: req.body.url,
    apps: []
  }
  // const initialData = await appDiscoverySchema.findOne(filter)
  // console.log(initialData)
  // let initialDisc
  // if (!initialData.discovery) {
  //   initialDisc = []
  // } else {
  //   initialDisc = initialData.discovery
  // }
  // let checkPresence = false
  // for (const sso of initialDisc) {
  //   // eslint-disable-next-line eqeqeq
  //   if (sso.url == req.body.url) {
  //     checkPresence = true
  //     break
  //   }
  // }
  // if (!checkPresence) {
  //   initialDisc.push(discovery)
  // } else {
  //   console.log('SSO present in db')
  // }
  const update = {
    discovery: discovery
  }
  try {
    await appDiscoverySchema.findOneAndUpdate(filter, update)
    console.log('Shopify Url saved succesfully')
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

router.get('/', async (req, res) => {
  try {
    req.session.orgID = 'org_qEHnRrdOzNUwWajN'
    const Data = await appDiscoverySchema.findOne({ ID: req.session.orgID })
    console.log(Data.ID, ':  :', Data.discovery.url)
    await getScriptTags(Data.ID, Data.discovery.url, Data.discovery.discName)
    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

export { router }
