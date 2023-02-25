import axios from 'axios'
import { google } from 'googleapis'
import subSchema from '../../../models/subscription.js'
import empSchema from '../../../models/employee.js'
export function getoauth2Client(client_id, client_secret) {
    const oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        'https://saasden.club/api/v1/gsuite/callback'
    )
    return oauth2Client
}
export async function getAuthorizationUrl(client_id, client_secret) {
    const scopes = [
        'https://www.googleapis.com/auth/drive.metadata.readonly',
        'https://www.googleapis.com/auth/admin.reports.usage.readonly',
        'https://www.googleapis.com/auth/apps.licensing',
        'https://www.googleapis.com/auth/admin.reports.audit.readonly'
    ]
    const oauth2Client = getoauth2Client(client_id, client_secret)
    const authorizationUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true
    })
    return authorizationUrl
}
export async function getGsuiteToken(code, client_id, client_secret) {
    const oauth2Client = getoauth2Client(client_id, client_secret)
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)
    return tokens.access_token
}
export async function getApps(access_token) {
    const apps = await axios.get('https://admin.googleapis.com/admin/reports/v1/usage/dates/2023-02-06', {
        headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json'
        }
    })
    const appList1 = []
    for (const report of apps.data.usageReports) {
        for (const parameter of report.parameters) {
            // eslint-disable-next-line eqeqeq
            if (parameter.name == 'accounts:authorized_apps') {
                for (const value of parameter.msgValue) {
                    appList1.push({ name: value.client_name, users: value.num_users })
                }
            }
        }
    }
    const apps2 = await axios.get('https://admin.googleapis.com/admin/reports/v1/activity/users/all/applications/token?endTime=2023-02-11T12:48:04.630Z&startTime=2022-08-01T12:48:04.630Z', {
        headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json'
        }
    })
    const appList2 = []
    for (const item of apps2.data.items) {
        const appsUsed = []
        for (const event of item.events) {
            appsUsed.push(event.parameters[1].value)
        }
        appList2.push({ email: item.actor.email, apps: appsUsed })
    }
    return { appList1, appList2 }
}
export async function getEmps(appList1, appList2, orgID) {
    const appSet = new Set()
    for (const app of appList1) {
        appSet.add(app.name)
    }

    const emailSet = new Set()
    const Maps = new Map()
    for (const data of appList2) {
        if (emailSet.has(data.email)) {
            Maps.get(data.email).add(data.apps[0])
        } else {
            const apps = new Set()
            apps.add(data.apps[0])
            emailSet.add(data.email)
            Maps.set(data.email, apps)
        }
    }
    const empList = []
    Maps.forEach(function(value, key) {
        const emp = { email: null, apps: [], source: 'gsuite' }
        emp.email = key
        const apps = Array.from(value)
        for (const app of apps) {
            emp.apps.push({ name: app })
        }
        empList.push(emp)
    })
    const filter = { ID: orgID }
    const orgData = await empSchema.findOne(filter)
    const empData = orgData.emps
    const updatedEmps = empData.concat(empList)
    const update = { emps: updatedEmps }
    await empSchema.findOneAndUpdate(filter, update)
    console.log('Gsuite employee data updated successfully')
}
export async function getSubs(appList1, appList2, orgID) {
    const filter = { ID: orgID }
    const subsData = await subSchema.findOne(filter)
    const appSet = new Set()
    for (const app of appList1) {
        appSet.add(app.name)
    }
    const emailSet = new Set()
    const Maps = new Map()
    for (const data of appList2) {
        if (emailSet.has(data.email)) {
            Maps.get(data.email).add(data.apps[0])
        } else {
            const apps = new Set()
            apps.add(data.apps[0])
            emailSet.add(data.email)
            Maps.set(data.email, apps)
        }
    }
    const subList = subsData.apps
    for (const app of appSet) {
        // const sub = { name: app, emps: [] }
        const emps = []
        const empSet = new Set()
        Maps.forEach(async function(value, key) {
            if (value.has(app)) {
                if (!empSet.has(key)) {
                    const emp = { email: key }
                    emps.push(emp)
                    empSet.add(key)
                }
            }
        })
        const sso = {
            id: null,
            name: 'gsuite'
        }
        let checkPresence = false
        for (const sub of subList) {
            // eslint-disable-next-line eqeqeq
            if (sub.name == app) {
                let checkSsoPresence = false
                for (const origin of sub.sso) {
                    // eslint-disable-next-line eqeqeq
                    if (origin.name == 'gsuite') {
                        checkSsoPresence = true
                        break
                    }
                }
                if (checkSsoPresence) {
                    continue
                }
                sub.sso.push(sso)
                checkPresence = true
                break
            }
        }
        if (checkPresence) {
            for (const sub of subList) {
                // eslint-disable-next-line eqeqeq
                if (sub.name == app) {
                    const updatedEmps = emps.concat(sub.emps)
                    sub.emps = updatedEmps
                    break
                }
            }
            continue
        }
        const ssoData = [sso]
            // console.log(app.name, ' : ', emps)
        subList.push({
            sso: ssoData,
            name: app,
            emps: emps,
            // ems data to be updated
            emsID: '',
            licences: null,
            currentCost: null,
            amountSaved: null,
            dueDate: ''
        })
    }
    const subData = {
        subList: subList,
        amtSaved: 0,
        amtSpent: 0
    }
    const update = {
        apps: subList,
        amtSpent: subData.amtSpent,
        amtSaved: subData.amtSaved
    }
    await subSchema.findOneAndUpdate(filter, update)
    console.log('Gsuite subscription data updated successfully')
    return subList
}