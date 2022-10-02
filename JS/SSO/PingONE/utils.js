import axios from 'axios'
import base64 from 'nodejs-base64-converter'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'
import url from 'url'

export async function getNewToken (domain, clientID, clientSecret, envID) {
  const client_creds = base64.encode(`${clientID}:${clientSecret}`)
  const params = new url.URLSearchParams({ grant_type: 'client_credentials' })
  const tokenSet = await axios.post(`https://auth.${domain}/${envID}/as/token`, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${client_creds}`
    }
  })
  return tokenSet.data.access_token
}

// Get List of Applications with their associated groups
async function getPingApps (domain, envID, accessToken) {
  const appList = []
  try {
    const res = await axios.get(`https://api.${domain}/v1/environments/${envID}/applications`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    res.data._embedded.applications.forEach(app => {
      if (app.accessControl && app.accessControl.group) {
        appList.push([
          app.id,
          app.name,
          app.enabled,
          app.accessControl.group.groups
        ])
      }
    })
    return appList
  } catch (error) {
    console.log(error)
  }
}

// Get list of all employees
async function getPingEmployees (domain, envID, accessToken) {
  try {
    const res = await axios.get(`https://api.${domain}/v1/environments/${envID}/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    const userList = []
    for (const user of res.data._embedded.users) {
      userList.push({
        id: user.id,
        firstname: user.name.given,
        lastname: user.name.family,
        username: user.email,
        email: user.email,
        apps: []
      })
    }
    return userList
  } catch (error) {
    console.log(error)
  }
}

// Get List of users in the groups associated with an app
async function getUsers (domain, envID, accessToken, groupList) {
  const userList = []
  for (const group of groupList) {
    try {
      const res = await axios.get(`https://api.${domain}/v1/environments/${envID}/users?filter=memberOfGroups[id%20eq%20%22${group.id}%22]`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      for (const user of res.data._embedded.users) {
        userList.push({
          id: user.id,
          userName: user.name.formatted,
          status: user.enabled
        })
      }
    } catch (error) {
      console.log(error)
    }
  }
  return [...new Set(userList)]
}

export async function getSubs (orgID, sso_creds, ems_creds) {
  let subList = []
  console.log(sso_creds)
  const appList = await getPingApps(sso_creds.domain, sso_creds.tenantID, sso_creds.accessToken)

  for (const app of appList) {
    const res = await getUsers(sso_creds.domain, sso_creds.tenantID, sso_creds.accessToken, app[3])
    subList.push({
      name: app[1],
      ssoID: app[0],
      emps: res,
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
  console.log('PingOne subscription data saved successfully')
}

// Get list of all employees along with their associated apps
export async function getEmps (orgID, sso_creds) {
  const appList = await getPingApps(sso_creds.domain, sso_creds.tenantID, sso_creds.accessToken)
  const userList = await getPingEmployees(sso_creds.domain, sso_creds.tenantID, sso_creds.accessToken)

  for (let i = 0; i < userList.length; i++) {
    const groupList = []
    const res = await axios.get(`https://api.${sso_creds.domain}/v1/environments/${sso_creds.tenantID}/users/${userList[i].id}/memberOfGroups?limit=100&expand=group`, {
      headers: {
        Authorization: `Bearer ${sso_creds.accessToken}`
      }
    })

    for (const group of res.data._embedded.groupMemberships) {
      groupList.push(group.id)
    }

    for (const app of appList) {
      for (const group of app[3]) {
        if (groupList.includes(group.id)) {
          userList[i].apps.push({
            id: app[0],
            name: app[1]
          })
        }
      }
    }
  }

  const filter = { ID: orgID }
  const update = { emps: userList }
  await empSchema.findOneAndUpdate(filter, update)
  console.log('PingOne Emp data saved successfully')
}
