import axios from 'axios'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'
import groupSchema from '../../../models/groups.js'
// verify if the token is still active
export async function verifyToken (domain, apiToken) {
  const res = await axios.get(`https://${domain}/api/v1/iam/roles`, {
    headers: {
      Authorization: `SSWS ${apiToken}`
    }
  })
  if (res.status !== 200) { return false }
  return true
}

// get list of applications
async function getApps (domain, apiToken) {
  try {
    const res = await axios.get(`https://${domain}/api/v1/apps`, {
      headers: {
        Authorization: `SSWS ${apiToken}`,
        'Content-Type': 'application/json'
      }
    })
    const appList = []
    res.data.forEach(app => appList.push({ id: app.id, label: app.label.toLowerCase(), status: app.status, link: app._links.users.href }))
    return appList
  } catch (error) {
    console.log(error)
  }
}

// get list of users
async function getUsers (domain, apiToken) {
  try {
    const res = await axios.get(`https://${domain}/api/v1/users`, {
      headers: {
        Authorization: `SSWS ${apiToken}`,
        'Content-Type': 'application/json'
      }
    })
    const userList = []
    res.data.forEach(user => userList.push({
      id: user.id,
      email: user.profile.email,
      firstname: user.profile.firstName,
      lastname: user.profile.lastName,
      username: user.profile.email,
      source: 'okta',
      apps: []
    }))
    return userList
  } catch (error) {
    console.log(error)
  }
}

// get app -> user mapping
export async function getSubs (orgID, sso_creds, ems_creds) {
  try {
    const filter = { ID: orgID }
    const appData = await getApps(sso_creds.domain, sso_creds.apiToken)
    console.log(appData)
    const subsData = await subSchema.findOne(filter)
    const subList = subsData.apps
    for (const app of appData) {
      const userData = await axios.get(app.link, {
        headers: {
          Authorization: `SSWS ${sso_creds.apiToken}`,
          'Content-Type': 'application/json'
        }
      })
      const empList = []
      for (const user of userData.data) {
        empList.push({
          id: user.id,
          email: user.profile.email,
          firstname: user.profile.name,
          lastname: '',
          username: user.profile.email
        })
      }
      const sso = {
        id: app.id,
        name: 'okta'
      }
      let checkPresence = false
      for (const sub of subList) {
        // eslint-disable-next-line eqeqeq
        if (sub.name == app.label) {
          let checkSsoPresence = false
          for (const origin of sub.sso) {
            // eslint-disable-next-line eqeqeq
            if (origin.name == 'okta') {
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
          if (sub.name == app.label) {
            const updatedEmps = empList.concat(sub.emps)
            sub.emps = updatedEmps
            break
          }
        }
        continue
      }
      const ssoData = [sso]
      subList.push({
        name: app.label,
        sso: ssoData,
        emps: empList,
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

    // switch ((ems_creds.name).toLowerCase()) {
    //   case 'xero':
    //     subData = await getXeroData(ems_creds.tenantID, ems_creds.accessToken, subData)
    //     break
    //   case 'zoho':
    //     subData = await getZohoData(ems_creds.tenantID, ems_creds.accessToken, subData)
    //     break
    // }

    const update = {
      apps: subList,
      amtSpent: subData.amtSpent,
      amtSaved: subData.amtSaved
    }
    console.log(subList)
    await subSchema.findOneAndUpdate(filter, update)
    console.log('Okta subscription data updated successfully')
  } catch (error) {
    console.log(error)
  }
}

// get user -> app mapping
export async function getEmps (orgID, sso_creds) {
  try {
    const userList = await getUsers(sso_creds.domain, sso_creds.apiToken)
    for (const user of userList) {
      const appList = await axios.get(`https://${sso_creds.domain}/api/v1/apps?filter=user.id+eq+"${user.id}"`, {
        headers: {
          Authorization: `SSWS ${sso_creds.apiToken}`,
          'Content-Type': 'application/json'
        }
      })
      for (const app of appList.data) {
        user.apps.push({
          id: app.id,
          name: app.label
        })
      }
    }
    const filter = { ID: orgID }
    const update = { emps: userList }
    await empSchema.findOneAndUpdate(filter, update)
    console.log('Okta employee data updated successfully')
  } catch (error) {
    console.log(error)
  }
}
// fetching all groups data
// fetching all users and apps of each group
// delete a complete group
// delete a user or an app from the group
export async function getGroups (orgID, sso_creds) {
  const groups = []
  const r = await axios.get(`https://${sso_creds.domain}/api/v1/groups?limit=200`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `SSWS ${sso_creds.apiToken}`
    }
  })
  const response = r.data
  for (let i = 0; i < response.length; i++) {
    const name = response[i].profile.name
    const { id } = response[i]
    const emps = []
    const e = await axios.get(`https://${sso_creds.domain}/api/v1/groups/${id}/users`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `SSWS ${sso_creds.apiToken}`
      }
    })
    const res = e.data
    for (let j = 0; j < res.length; j++) {
      const { id } = res[j]
      const email = res[j].profile.email
      const fname = res[j].profile.firstName
      const lname = res[j].profile.lastName
      const userName = null
      const emp = { id: id, email: email, firstname: fname, username: userName, lastname: lname }
      emps.push(emp)
    }
    const p = await axios.get(`https://${sso_creds.domain}/api/v1/groups/${id}/apps`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `SSWS ${sso_creds.apiToken}`
      }
    })
    const resp = p.data
    const apps = []
    for (let k = 0; k < resp.length; k++) {
      const { id, label } = resp[k]
      const app = { id: id, name: label }
      console.log(app)
      apps.push(app)
    }
    const group = { name: name, groupId: id, emps: emps, apps: apps, source: 'okta' }
    groups.push(group)
  }
  const filter = { ID: orgID }
  const update = { groups: groups }
  await groupSchema.findOneAndUpdate(filter, update)
  console.log('Okta group data updated successfully')
}
