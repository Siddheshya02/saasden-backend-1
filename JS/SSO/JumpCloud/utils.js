import axios from 'axios'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'

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

export async function getSubs (orgName, sso_creds, ems_creds) {
  let subList = []
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

  // EMS Code to fetch remaining details
  switch ((ems_creds.name).toLowerCase()) {
    case 'xero':
      subList = await getXeroData(ems_creds.tenantID, ems_creds.accessToken, subList)
      break
    case 'zoho':
      subList = await getZohoData(ems_creds.tenantID, ems_creds.accessToken, subList)
      break
  }

  const filter = { name: orgName }
  const update = { apps: subList }
  await subSchema.findOneAndUpdate(filter, update)
  console.log('Jumpcloud subscription data updated successfully')
  return subList
}

export async function getEmps (orgName, sso_creds) {
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
  const filter = { name: orgName }
  const update = { emps: empList }
  await empSchema.findOneAndUpdate(filter, update)
  console.log('Jumpcloud employee data updated successfully')
}
