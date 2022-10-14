import axios from 'axios'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'

// get onelogin access token
export async function getNewToken (clientID, clientSecret, tenantId) {
  const token = await axios.post(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: `${clientID}`,
      scope: 'https://graph.microsoft.com/.default',
      client_secret: `${clientSecret}`,
      grant_type: 'client_credentials'
    })
  ).then(res => {
    return res.data.access_token
  })
  return token
}

// get list of apps used by the org
async function getApps (accessToken) {
  const apps = await axios.get('https://graph.microsoft.com/v1.0/applications', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }).then(res => { return res.data.value }).catch(res => console.log(res))
  const len_apps = apps.length
  const finalAppDetails = []
  for (let i = 0; i < len_apps; i++) {
    const { appId, displayName } = apps[i]
    const users = []
    const len_user = apps[i].appRoles.length
    for (let j = 0; j < len_user; j++) {
      const { id, displayName } = apps[i].appRoles[j]
      const userObject = { userID: id, userName: displayName }
      users.push(userObject)
    }
    const appObject = { appID: appId, appName: displayName, users: users }
    finalAppDetails.push(appObject)
  }
  for (const app of finalAppDetails) {
    app.appName = app.appName.toLowerCase()
  }
  return finalAppDetails
}

// get list of users in the org
async function getUsers (accessToken) {
  const finalUserDetails = []
  const list = await axios.get('https://graph.microsoft.com/v1.0/users/', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }).then(res => { return res.data.value }).catch(res => console.log(res))
  for (let i = 0; i < list.length; i++) {
    const { id, displayName } = list[i]
    const dat = await axios.get(`https://graph.microsoft.com/v1.0/users/${list[i].id}/appRoleAssignments`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(res => { return res.data.value }).catch(res => console.log(res))
    const apps = []
    for (let j = 0; j < dat.length; j++) {
      const { id, resourceDisplayName } = dat[j]
      const appsObject = { appID: id, appName: resourceDisplayName }
      apps.push(appsObject)
    }
    const userObject = { userID: id, userName: displayName, apps: apps }
    finalUserDetails.push(userObject)
  }
  return finalUserDetails
}

export async function getSubs (orgID, sso_creds, ems_creds) {
  let subList = []
  const appList = await getApps(sso_creds.accessToken)

  for (const app of appList) {
    const emps = []
    for (const user of app.users) {
      emps.push({
        id: user.userID,
        username: user.userName
      })
    }

    subList.push({
      ssoID: app.appID,
      name: app.appName,
      emps: emps,
      // data to be fetched from EMS
      emsID: '',
      licences: null,
      currentCost: null,
      amountSaved: null,
      dueDate: ''
    })
  }

  switch ((ems_creds.name).toLowerCase()) {
    case 'xero':
      subList = await getXeroData(ems_creds.tenantID, ems_creds.accessToken, subList)
      break
    case 'zoho':
      subList = await getZohoData(ems_creds.tenantID, ems_creds.accessToken, subList)
      break
  }

  const filter = { ID: orgID }
  const update = { apps: subList }
  await subSchema.findOneAndUpdate(filter, update)
  console.log('Azure subscription data updated successfully')
}

export async function getEmps (orgID, sso_creds) {
  const userList = []
  const empList = await getUsers(sso_creds.accessToken)

  for (const emp of empList) {
    const appList = emp.apps
    const userAppList = []
    for (const app of appList) {
      userAppList.push({
        name: app.appName.toLowerCase(),
        id: app.appID
      })
    }
    userList.push({
      id: emp.userId,
      email: emp.email,
      firstname: emp.firstname,
      username: emp.userName,
      lastname: emp.lastname,
      apps: userAppList
    })
  }

  const filter = { ID: orgID }
  const update = { emps: userList }
  await empSchema.findOneAndUpdate(filter, update)
  console.log('Azure employee data updated successfully')
}
