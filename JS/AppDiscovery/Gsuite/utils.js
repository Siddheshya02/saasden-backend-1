import axios from 'axios'
import { google } from 'googleapis'
export function getoauth2Client (client_id, client_secret) {
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/callback/'
  )
  return oauth2Client
}
export async function getAuthorizationUrl (client_id, client_secret) {
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
export async function getGsuiteToken (code, client_id, client_secret) {
  const oauth2Client = getoauth2Client(client_id, client_secret)
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)
  return tokens.access_token
}
export async function getSubs (access_token) {
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
export async function getAuthorizedApps (appList1, appList2) {
  const appSet = new Set()
  for (const app of appList1) {
    appSet.add(app.name)
  }

  const emailSet = new Set()
  const Maps = new Map()
  for (const data of appList2) {
    if (emailSet.has(data.email) && appSet.has(data.apps[0])) {
      Maps.get(data.email).add(data.apps[0])
    } else {
      const apps = new Set()
      if (appSet.has(data.apps[0])) {
        apps.add(data.apps[0])
      }
      emailSet.add(data.email)
      Maps.set(data.email, apps)
    }
  }
  const Authorized = {}
  Maps.forEach(function (value, key) {
    Authorized[key] = Array.from(value)
  })
  return Authorized
}
export async function getunAuthorizedApps (appList1, appList2) {
  const appSet = new Set()
  for (const app of appList1) {
    appSet.add(app.name)
  }
  const emailSet = new Set()
  const Maps = new Map()
  for (const data of appList2) {
    if (emailSet.has(data.email)) {
      if (appSet.has(data.apps[0])) {
        continue
      }
      Maps.get(data.email).add(data.apps[0])
    } else {
      const apps = new Set()
      if (appSet.has(data.apps[0])) {
        continue
      }
      emailSet.add(data.email)
      Maps.set(data.email, apps)
    }
  }
  const unAuthorized = {}
  Maps.forEach(function (value, key) {
    unAuthorized[key] = Array.from(value)
  })

  return unAuthorized
}
