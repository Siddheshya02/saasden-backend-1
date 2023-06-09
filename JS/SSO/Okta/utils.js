import axios from 'axios'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'

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
    res.data.forEach(app => appList.push([app.id, app.label, app.status, app._links.users.href]))
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
    const appData = await getApps(sso_creds.domain, sso_creds.apiToken)
    const subList = []
    for (const app of appData) {
      const userData = await axios.get(app[3], {
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

      subList.push({
        name: app[1],
        ssoID: app[0],
        emps: empList,
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
