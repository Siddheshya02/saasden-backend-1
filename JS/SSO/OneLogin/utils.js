import axios from 'axios'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'
import groupSchema from '../../../models/groups.js'
// verify separately because the token is non-JWT
export async function verifyToken (domain, access_token) {
  const res = await axios.get(`https://${domain}/api/2/api_authorizations`, {
    headers: { Authorization: `Bearer ${access_token}` }
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
async function getApps (domain, access_token) {
  const res = await axios.get(`https://${domain}/api/2/apps`, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })
  const apps = res.data
  for (const app of apps) {
    app.name = app.name.toLowerCase()
  }
  return apps
}

// get list of users in the org
async function getUsers (domain, access_token) {
  const res = await axios.get(`https://${domain}/api/2/users`, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })
  return res.data
}

// get apps used by a user
async function getUserApps (userID, domain, access_token) {
  const res = await axios.get(`https://${domain}/api/2/users/${userID}/apps`, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })
  return res.data
}

export async function getSubs (orgID, sso_creds, ems_creds) {
  const filter = { ID: orgID }
  const subsData = await subSchema.findOne(filter)
  const subList = subsData.apps
  const appList = await getApps(sso_creds.domain, sso_creds.access_token)

  for (const app of appList) {
    const res = await axios.get(`https://${sso_creds.domain}/api/2/apps/${app.id}/users`, {
      headers: {
        Authorization: `Bearer ${sso_creds.access_token}`
      }
    })

    let emps = []
    for (const user of res.data) {
      emps.push({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        email: user.email
      })
    }
    const sso = {
      id: app.id,
      name: 'onelogin'
    }
    let checkPresence = false
    for (const sub of subList) {
      // eslint-disable-next-line eqeqeq
      if (sub.name == app.name) {
        const updatedEmps = emps.concat(sub.emps)
        emps = updatedEmps
        let checkSsoPresence = false
        for (const origin of sub.sso) {
          // eslint-disable-next-line eqeqeq
          if (origin.name == 'onelogin') {
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
        if (sub.name == app.name) {
          const updatedEmps = emps.concat(sub.emps)
          sub.emps = updatedEmps
          break
        }
      }
      continue
    }
    const ssoData = [sso]
    subList.push({
      sso: ssoData,
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
  await subSchema.findOneAndUpdate(filter, update)
  console.log('OneLogin subscription data updated successfully')
}

export async function getEmps (orgID, sso_creds) {
  const userList = []
  const empList = await getUsers(sso_creds.domain, sso_creds.access_token)

  for (const emp of empList) {
    const appList = await getUserApps(emp.id, sso_creds.domain, sso_creds.access_token)
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
      source: 'onelogin',
      apps: userAppList
    })
  }

  const filter = { ID: orgID }
  const orgData = await empSchema.findOne(filter)
  const empData = orgData.emps
  const updatedEmps = empData.concat(userList)
  const update = { emps: updatedEmps }
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
      Authorization: `bearer ${sso_creds.access_token}`
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
        Authorization: `bearer ${sso_creds.access_token}`
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
        Authorization: `bearer ${sso_creds.access_token}`
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
    const group = { name: name, groupId: id, emps: emps, apps: apps, source: 'onelogin' }
    groups.push(group)
  }
  const filter = { ID: orgID }
  const orgData = await groupSchema.findOne(filter)
  const grpData = orgData.groups
  const updatedgrps = grpData.concat(groups)
  const update = { groups: updatedgrps }
  await groupSchema.findOneAndUpdate(filter, update)
  console.log('OneLogin group data updated successfully')
}

// craeteUser

export async function createUser (sso, user) {
  const response = await axios.post(
    `https://${sso.domain}/api/2/users`,
    {
      firstname: `${user.firstName}`,
      lastname: `${user.lastName}`,
      email: `${user.email}`,
      username: `${user.username}`
    },
    {
      headers: {
        Authorization: `bearer ${sso.access_token}`,
        'Content-Type': 'application/json'
      }
    }
  ).then(function (response) {
    // console.log(JSON.stringify(response.data))
    console.log('User created successfully')
  })
    .catch(function (error) {
      console.log(error)
    })
}

export async function deleteUser (sso, user) {
  const deleteUser = axios.delete(`https://${sso.domain}/api/2/users/${user.userId}`, {
    headers: {
      Authorization: `bearer ${sso.access_token}`,
      'Content-Type': 'application/json'
    }
  }).then(function (response) {
    // console.log(JSON.stringify(response.data))
    console.log('User deleted successfully')
  })
    .catch(function (error) {
      console.log(error)
    })
}
export async function deleteUserFromGroup (sso, userInfo, grpInfo) {
  const deleteUserFromGroup = axios.delete(`https://${sso.domain}/api/2/roles/${grpInfo.groupId}/users`, {
    data: `[${userInfo.userId}]`
  }, {
    headers: {
      Authorization: `bearer ${sso.access_token}`,
      'Content-Type': 'application/json'
    }
  }).then((data) => {
    console.log('User successfully deleted from group')
  })
    .catch((err) => {
      console.log(err)
    })
}
export async function addUserToGroup (sso, userInfo, grpInfo) {
  const options = {
    data: [`${userInfo.userId}`],
    headers: {
      Authorization: `bearer ${sso.access_token}`,
      'Content-Type': 'application/json'
    }
  }
  const addUserToGroup = axios.post(`https://${sso.domain}/api/2/roles/${grpInfo.groupId}/users`, options).then((data) => {
    console.log('User added to group successfully')
  })
    .catch((err) => {
      console.log(err)
    })
}
