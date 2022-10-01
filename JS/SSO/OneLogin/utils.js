import axios from 'axios'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'

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

export async function getSubs (orgName, sso_creds, ems_creds) {
  let subList = []
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
  console.log('OneLogin subscription data updated successfully')
}

export async function getEmps (orgName, sso_creds) {
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

  const filter = { name: orgName }
  const update = { emps: userList }
  await empSchema.findOneAndUpdate(filter, update)
  console.log('OneLogin employee data updated successfully')
}
