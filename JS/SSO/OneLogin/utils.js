import axios from 'axios'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'
import groupSchema from '../../../models/groups.js'
// verify separately because the token is non-JWT
export async function verifyToken (domain, accessToken) {
  const res = await axios.get(`https://${domain}/api/2/api_authorizations`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (res.status === 401) { return false }
  return true
}

export async function getNewToken (domain, clientID, clientSecret) {
  const tokenSet = await axios.post(`https://${domain}/auth/oauth2/v2/token`, {
    client_id: clientID,
    client_secret: clientSecret,
    grant_type: 'client_credentials'
  }, {
    'Content-Type': 'application/x-www-form-urlencoded'
  })
  return tokenSet.data.access_token
}

// get list of apps used by the org
async function getApps (domain, accessToken) {
  const res = await axios.get(`https://${domain}/api/2/apps`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  const apps = res.data
  for (const app of apps) {
    app.name = app.name.toLowerCase()
  }
  return apps
}

// get list of users in the org
async function getUsers (domain, accessToken) {
  const res = await axios.get(`https://${domain}/api/2/users`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  return res.data
}

// get apps used by a user
async function getUserApps (userID, domain, accessToken) {
  const res = await axios.get(`https://${domain}/api/2/users/${userID}/apps`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  return res.data
}

export async function getSubs (orgID, sso_creds, ems_creds) {
  const subList = []
  const appList = await getApps(sso_creds.domain, sso_creds.accessToken)

  for (const app of appList) {
    const res = await axios.get(`https://${sso_creds.domain}/api/2/apps/${app.id}/users`, {
      headers: {
        Authorization: `Bearer ${sso_creds.accessToken}`
      }
    })

    const emps = []
    for (const user of res.data) {
      emps.push({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        email: user.email
      })
    }

    subList.push({
      ssoID: app.id,
      name: app.name,
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
  console.log('OneLogin subscription data updated successfully')
}

export async function getEmps (orgID, sso_creds) {
  const userList = []
  const empList = await getUsers(sso_creds.domain, sso_creds.accessToken)

  for (const emp of empList) {
    const appList = await getUserApps(emp.id, sso_creds.domain, sso_creds.accessToken)
    const userAppList = []
    for (const app of appList) {
      userAppList.push({
        name: app.name.toLowerCase(),
        id: app.id
      })
    }
    userList.push({
      id: emp.id,
      email: emp.email,
      firstname: emp.firstname,
      userName: emp.username,
      lastname: emp.lastname,
      apps: userAppList
    })
  }

  const filter = { ID: orgID }
  const update = { emps: userList }
  await empSchema.findOneAndUpdate(filter, update)
  console.log('OneLogin employee data updated successfully')
}
// fetching all groups data
// fetching all users and apps of each group
// delete a complete group
// delete a user or an app from the group
export async function getGroups (orgID, sso_creds) {
  const groups = []
  const response = await axios.get(`https://${sso_creds.domain}/api/2/roles`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `bearer ${sso_creds.accessToken}`
    }
  }).then(response => {
    return response.data
  })
    .catch(error => {
      console.error('There was an error!', error)
    })
  for (let i = 0; i < response.length; i++) {
    const name = response[i].name
    const { id } = response[i]
    const emps = []
    const res = await axios.get(`https://${sso_creds.domain}/api/2/roles/${id}/users`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `bearer ${sso_creds.accessToken}`
      }
    }).then(res => {
    // console.log(res.data);
      return res.data
    })
      .catch(error => {
      // element.parentElement.innerHTML = `Error: ${error.message}`;
        console.error('There was an error!', error)
      })
    for (let j = 0; j < res.length; j++) {
      const { id } = res[j]
      const email = res[j].email
      const fname = res[j].name
      const lname = null
      const userName = res[j].username
      const emp = { id: id, email: email, firstname: fname, username: userName, lastname: lname }
      emps.push(emp)
    }
    const resp = await axios.get(`https://${sso_creds.domain}/api/2/roles/${id}/apps`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `bearer ${sso_creds.accessToken}`
      }
    }).then(res => {
      return res.data
    })
      .catch(error => {
        console.error('There was an error!', error)
      })
    const apps = []
    for (let k = 0; k < resp.length; k++) {
      const { id, name } = resp[k]
      const app = { id: id, name: name }
      apps.push(app)
    }
    const group = { name: name, groupId: id, emps: emps, apps: apps }
    groups.push(group)
  }
  const filter = { ID: orgID }
  const update = { groups: groups }
  await groupSchema.findOneAndUpdate(filter, update)
  console.log('OneLogin group data updated successfully')
}
