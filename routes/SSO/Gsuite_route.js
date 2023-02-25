import express from 'express'
import { getAuthorizationUrl, getGsuiteToken } from '../../JS/AppDiscovery/Gsuite/utils.js'
// import orgSchema from '../../models/organization.js'
import appDiscoverySchema from '../../models/appDiscovery.js'
import orgSchema from '../../models/organization.js'
import url from 'url'
const router = express.Router()

router.post('/auth', async(req, res) => {
    const filter = { ID: req.session.orgID }
    const ssoData = {
        ssoName: 'gsuite',
        clientID: req.body.clientID,
        clientSecret: req.body.clientSecret,
        tenantID: null,
        domain: null,
        apiToken: null
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
        if (sso.ssoName == 'gsuite') {
            checkPresence = true
        }
    }
    if (!checkPresence) {
        initialSSos.push(ssoData)
    } else {
        console.log('SSO present in database')
    }
    const update = {
            ssoData: initialSSos
        }
        // console.log(req.session)
    try {
        await orgSchema.findOneAndUpdate(filter, update)
        console.log('Gsuite credentials saved successfully')
        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})
router.get('/', async(req, res) => {
    try {
        const orgData = await orgSchema.findOne({ ID: req.session.orgID })
        const ssos = orgData.ssoData
        let client_id
        let client_secret
        for (const sso of ssos) {
            // eslint-disable-next-line eqeqeq
            if (sso.ssoName == 'gsuite') {
                client_id = sso.clientID
                client_secret = sso.clientSecret
                break
            }
        }
        const authorizationUrl = await getAuthorizationUrl(client_id, client_secret)
        res.status(200).json(authorizationUrl)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})
router.get('/callback', async(req, res) => {
    const code = req.query.code
    const orgData = await orgSchema.findOne({ ID: req.session.orgID })
    const ssos = orgData.ssoData
    let client_id
    let client_secret
    for (const sso of ssos) {
        // eslint-disable-next-line eqeqeq
        if (sso.ssoName == 'gsuite') {
            client_id = sso.clientID
            client_secret = sso.clientSecret
            break
        }
    }
    const access_token = await getGsuiteToken(code, client_id, client_secret)
    let checkPresence = false
    for (const sso of req.session.ssos) {
        // eslint-disable-next-line eqeqeq
        if (sso.ssoName == 'gsuite') {
            checkPresence = true
            break
        }
    }
    if (!checkPresence) {
        const gsuiteData = {
            ssoName: 'gsuite',
            clientID: client_id,
            clientSecret: client_secret,
            access_token: access_token
        }
        req.session.ssos.push(gsuiteData)
    } else {
        for (const sso of req.session.ssos) {
            // eslint-disable-next-line eqeqeq
            if (sso.ssoName == 'gsuite') {
                sso.clientID = client_id
                sso.clientSecret = client_secret
                sso.access_token = access_token
                break
            }
        }
    }
    res.sendStatus(200)
})
export { router }