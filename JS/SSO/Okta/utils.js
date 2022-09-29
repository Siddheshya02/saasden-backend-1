import axios from 'axios'
import empSchema from '../../../models/employee.js'
import getXeroData from '../../EMS/Xero'
import getZohoData from '../../EMS/Zoho'
import subSchema from '../../../models/subscription.js'

// get list of applications
async function getApps (domain, apiToken) {
  const res = await axios.get(`https://${domain}/api/v1/apps`, {
    headers: {
      Authorization: `SSWS ${apiToken}`,
      'Content-Type': 'application/json'
    }
  })
  const appList = []
  res.data.forEach(app => appList.push([app.id, app.label, app.status, app._links.users.href]))
  return appList
}

// get list of users
async function getUsers (domain, apiToken) {
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
}

// get app -> user mapping
export async function getSubs (orgName, sso_creds, ems_creds) {
  try {
    const appData = await getApps(sso_creds.domain, sso_creds.apiToken)
    let subList = []
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

    switch ((ems_creds.name).toLowerCase()) {
      case 'xero':
        subList = await getXeroData(ems_creds.tenantID, ems_creds.accessToken, subList)
        break
      case 'zoho':
        subList = await getZohoData(/* relevant zoho parameters */)
        break
    }

    const filter = { name: orgName }
    const update = { apps: subList }
    await subSchema.findOneAndUpdate(filter, update)
    console.log('Okta subscription data updated successfully')
  } catch (error) {
    console.log(error)
  }
}

// get user -> app mapping
export async function getEmps (orgName, sso_creds) {
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
    const filter = { name: orgName }
    const update = { emps: userList }
    await empSchema.findOneAndUpdate(filter, update)
    console.log('Okta employee data updated successfully')
  } catch (error) {
    console.log(error)
  }
}
