import axios from 'axios'
import base64 from 'nodejs-base64-converter'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'
import url from 'url'

// Generate a new token if the previous token has expired
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
async function getPingApps (domain, envID, access_token) {
  const appList = []
  try {
    const res = await axios.get(`https://api.${domain}/v1/environments/${envID}/applications`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })
    res.data._embedded.applications.forEach(app => {
      if (app.accessControl && app.accessControl.group) {
        appList.push({
          id: app.id,
          name: app.name,
          enabled: app.enabled,
          grps: app.accessControl.group.groups
        })
      }
    })
    return appList
  } catch (error) {
    console.log(error)
  }
}

// Get list of all employees
async function getPingEmployees (domain, envID, access_token) {
  try {
    const res = await axios.get(`https://api.${domain}/v1/environments/${envID}/users`, {
      headers: {
        Authorization: `Bearer ${access_token}`
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
        source: 'pingone',
        apps: []
      })
    }
    return userList
  } catch (error) {
    console.log(error)
  }
}

// Get List of users in the groups associated with an app
// BUG: PingONE User details not fetched
async function getUsers (domain, envID, access_token, groupList) {
  const userList = []
  for (const group of groupList) {
    try {
      const res = await axios.get(`https://api.${domain}/v1/environments/${envID}/users?filter=memberOfGroups[id%20eq%20%22${group.id}%22]`, {
        headers: {
          Authorization: `Bearer ${access_token}`
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
  const filter = { ID: orgID }
  const subsData = await subSchema.findOne(filter)
  const subList = subsData.apps
  const appList = await getPingApps(sso_creds.domain, sso_creds.tenantID, sso_creds.access_token)

  for (const app of appList) {
    const res = await getUsers(sso_creds.domain, sso_creds.tenantID, sso_creds.access_token, app[3])
    const sso = {
      id: app.id,
      name: 'pingone'
    }
    let checkPresence = false
    for (const sub of subList) {
      // eslint-disable-next-line eqeqeq
      if (sub.name == app.name) {
        let checkSsoPresence = false
        for (const origin of sub.sso) {
          // eslint-disable-next-line eqeqeq
          if (origin.name == 'pingone') {
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
      continue
    }
    const ssoData = [sso]
    subList.push({
      name: app.name,
      sso: ssoData,
      emps: res,
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
      subData = await getXeroData(ems_creds.tenantID, ems_creds.access_token, subData)
      break
    case 'zoho':
      subData = await getZohoData(ems_creds.tenantID, ems_creds.access_token, subData)
      break
  }
  const update = {
    apps: subList,
    amtSpent: subData.amtSpent,
    amtSaved: subData.amtSaved
  }
  await subSchema.findOneAndUpdate(filter, update)
  console.log('PingOne subscription data saved successfully')
}

// Get list of all employees along with their associated apps
export async function getEmps (orgID, sso_creds) {
  const appList = await getPingApps(sso_creds.domain, sso_creds.tenantID, sso_creds.access_token)
  const userList = await getPingEmployees(sso_creds.domain, sso_creds.tenantID, sso_creds.access_token)

  for (let i = 0; i < userList.length; i++) {
    const groupList = []
    const res = await axios.get(`https://api.${sso_creds.domain}/v1/environments/${sso_creds.tenantID}/users/${userList[i].id}/memberOfGroups?limit=100&expand=group`, {
      headers: {
        Authorization: `Bearer ${sso_creds.access_token}`
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
  const orgData = await empSchema.findOne(filter)
  const empData = orgData.emps
  const updatedEmps = empData.concat(userList)
  const update = { emps: updatedEmps }
  await empSchema.findOneAndUpdate(filter, update)
  console.log('PingOne Emp data saved successfully')
}
export async function getGroups (orgID, sso_creds) {
  let gs = await axios.get(`https://api.${sso_creds.domain}/v1/environments/${sso_creds.tenantID}/groups`, {
    headers: {
      Authorization: `Bearer ${sso_creds.access_token}`
    }
  })
  gs = gs.data._embedded.groups
  const groups = []
  for (let i = 0; i < gs.length; i++) {
    const { name, id } = gs[i]
    let us = await axios.get(`https://api.${sso_creds.domain}/v1/environments/${sso_creds.tenantID}/users?filter=memberOfGroups[id eq "${id}"]`, {
      headers: {
        Authorization: `Bearer ${sso_creds.access_token}`
      }
    })
    us = us.data._embedded.users
    const emps = []
    for (let i = 0; i < us.length; i++) {
      const userId = us[i].id
      const userName = us[i].username
      const email = us[i].email
      const fname = us[i].name.given
      const lname = us[i].name.family
      const emp = { id: userId, email: email, firstname: fname, lastname: lname, username: userName }
      emps.push(emp)
    }
  }
}
