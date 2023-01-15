import axios from 'axios'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'
import groupSchema from '../../../models/groups.js'
// verify if the token is still active
export async function verifyToken (apiToken) {
  const res = await axios.get('https://console.jumpcloud.com/api/organizations', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${apiToken}`
    }
  })
  if (res.status !== 200) { return false }
  return true
}

async function getApps (apiToken) {
  const res = await axios.get('https://console.jumpcloud.com/api/applications', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${apiToken}`
    }
  })
  return res.data.results
}

async function getUsers (apiToken) {
  const res = await axios.get('https://console.jumpcloud.com/api/systemusers', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${apiToken}`
    }
  })
  return res.data.results
}

async function getUserData (apiToken, userID) {
  const res = await axios.get(`https://console.jumpcloud.com/api/systemusers/${userID}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${apiToken}`
    }
  })
  const userData = res.data
  return {
    id: userData.id,
    email: userData.email,
    firstname: userData.firstname,
    username: userData.username,
    lastname: userData.lastname
  }
}

async function getAppUsers (appID, apiToken) {
  const res = await axios.get(`https://console.jumpcloud.com/api/v2/applications/${appID}/users`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${apiToken}`
    }
  })

  const userList = []
  for (const user of res.data) {
    const userData = await getUserData(apiToken, user.id)
    userList.push(userData)
  }
  return userList
}

async function getUserApps (userID, apiToken, appMap) {
  const res = await axios.get(`https://console.jumpcloud.com/api/v2/users/${userID}/applications`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${apiToken}`
    }
  })

  const appList = []
  for (const app of res.data) {
    appList.push({
      ssoID: app.id,
      name: appMap[app.id]
    })
  }
  return appList
}

export async function getSubs (orgID, sso_creds, ems_creds) {
  const subList = []
  const appList = await getApps(sso_creds.apiToken)
  for (const app of appList) {
    const emps = await getAppUsers(app.id, sso_creds.apiToken)
    subList.push({
      ssoID: app.id,
      name: app.name,
      emps: emps,
      // ems data to be updated
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
  console.log('Jumpcloud subscription data updated successfully')
  return subList
}

export async function getEmps (orgID, sso_creds) {
  const apps = await getApps(sso_creds.apiToken)
  const appMap = {}
  apps.forEach(app => {
    appMap[app.id] = app.name
  })

  const empList = []
  const userList = await getUsers(sso_creds.apiToken)
  for (const user of userList) {
    const appList = await getUserApps(user.id, sso_creds.apiToken, appMap)
    empList.push({
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      username: user.username,
      lastname: user.lastname,
      apps: appList
    })
  }
  const filter = { ID: orgID }
  const update = { emps: empList }
  await empSchema.findOneAndUpdate(filter, update)
  console.log('Jumpcloud employee data updated successfully')
}
// fetch Jumpcloud group data
export async function getGroups (orgID, sso_creds) {
  const groups = []
  const response = await axios.get('https://console.jumpcloud.com/api/v2/usergroups', {
    headers: {
      uri: 'https://console.jumpcloud.com/api/v2/usergroups',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${sso_creds.apiToken}`
    }
  })
  const res = response.data
  for (let i = 0; i < res.length; i++) {
    const { name, id } = res[i]
    const emps = []
    let e = await axios.get(`https://console.jumpcloud.com/api/v2/usergroups/${id}/members`, {
      headers: {
        uri: `https://console.jumpcloud.com/api/v2/usergroups/${id}/members`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': `${sso_creds.apiToken}`
      }
    })
    e = e.data
    for (let j = 0; j < e.length; j++) {
      if (e[j] == null) {
        continue
      }
      const userId = e[j].to.id
      const u = await axios.get(`https://console.jumpcloud.com/api/systemusers/${userId}`, {
        headers: {
          uri: `https://console.jumpcloud.com/api/systemusers/${userId}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': `${sso_creds.apiToken}`
        }
      })
      const us = u.data
      const emp = { id: us.id, email: us.email, firstname: us.firstname, lastname: us.lastname, username: us.username }
      emps.push(emp)
    }
    const apps = []
    let a = await axios.get(`https://console.jumpcloud.com/api/v2/usergroups/${id}/applications`, {
      headers: {
        uri: `https://console.jumpcloud.com/api/v2/usergroups/${id}/applications`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': `${sso_creds.apiToken}`
      }
    })
    a = a.data
    for (let j = 0; j < a.length; j++) {
      if (a[i] == null) {
        continue
      }
      const ap = await axios.get(`https://console.jumpcloud.com/api/v2/applications/${a[j].id}`, {
        headers: {
          uri: `https://console.jumpcloud.com/api/v2/applications/${a[j].id}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': `${sso_creds.apiToken}`
        }
      })
      const app = { id: ap.data._id, name: ap.data.name }
      apps.push(app)
    }
    const group = { name: name, groupId: id, emps: emps, apps: apps }
    groups.push(group)
  }
  const filter = { ID: orgID }
  const update = { groups: groups }
  await groupSchema.findOneAndUpdate(filter, update)
  console.log('JumpCloud group data updated successfully')
}
