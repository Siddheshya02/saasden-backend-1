import axios from 'axios'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'
import groupSchema from '../../../models/groups.js'
// Generate a new token if the previous token has expired
export async function getNewToken (clientID, clientSecret, tenantId) {
  const tokenSet = await axios.post(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: `${clientID}`,
      scope: 'https://graph.microsoft.com/.default',
      client_secret: `${clientSecret}`,
      grant_type: 'client_credentials'
    })
  )
  return tokenSet.data.accessToken
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
  const subList = []
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

  let subData = {
    subList: subList,
    amtSaved: 0,
    amtSpent: 0
  }

  switch ((ems_creds.name).toLowerCase()) {
    case 'xero':
      subData = await getXeroData(ems_creds.tenantID, ems_creds.accessToken, subData)
      break
    case 'zoho':
      subData = await getZohoData(ems_creds.tenantID, ems_creds.accessToken, subData)
      break
  }
  const filter = { ID: orgID }
  const update = {
    apps: subList,
    amtSpent: subData.amtSpent,
    amtSaved: subData.amtSaved
  }
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
// fetching azure group data
export async function getGroups (orgID, sso_creds) {
  const groups = []
  const response = await axios.get('https://graph.microsoft.com/beta/groups', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `bearer ${sso_creds.accessToken}`
    }
  }).then(response => {
    return response.data.value
  })
    .catch(error => {
      console.error('There was an error!', error)
    })
  for (let i = 0; i < response.length; i++) {
    const name = response[i].displayName
    const { id } = response[i]
    const emps = []
    const res = await axios.get(`https://graph.microsoft.com/v1.0/groups/${id}/members`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `bearer ${sso_creds.accessToken}`
      }
    }).then(res => {
    // console.log(res.data);
      return res.data.value
    })
      .catch(error => {
      // element.parentElement.innerHTML = `Error: ${error.message}`;
        console.error('There was an error!', error)
      })
    for (let j = 0; j < res.length; j++) {
      const { id } = res[j]
      const email = res[j].userPrincipalName
      const fname = res[j].givenName
      const lname = res[j].surname
      const userName = null
      const emp = { id: id, email: email, firstname: fname, username: userName, lastname: lname }
      emps.push(emp)
    }
    const resp = await axios.get(`https://graph.microsoft.com/beta/groups/${id}/members`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `bearer ${sso_creds.accessToken}`
      }
    }).then(res => {
      return res.data.value
    })
      .catch(error => {
        console.error('There was an error!', error)
      })
    const apps = []
    for (let k = 0; k < resp.length; k++) {
      if (resp[k].appId) {
        const { appId } = resp[k]
        const appName = resp[k].appDisplayName
        const app = { id: appId, name: appName }
        apps.push(app)
      }
    }
    const group = { name: name, groupId: id, emps: emps, apps: apps }
    groups.push(group)
  }
  console.log(groups)
  const filter = { ID: orgID }
  const update = { groups: groups }
  await groupSchema.findOneAndUpdate(filter, update)
  console.log('Azure group data updated successfully')
}
