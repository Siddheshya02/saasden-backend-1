import axios from 'axios'
import empSchema from '../../../models/employee.js'
import { getXeroData } from '../../EMS/Xero/utils.js'
import { getZohoData } from '../../EMS/Zoho/utils.js'
import subSchema from '../../../models/subscription.js'
import groupSchema from '../../../models/groups.js'
import { LeaveTypeObject } from 'xero-node/dist/gen/model/payroll-uk/leaveTypeObject.js'
// Generate a new token if the previous token has expired
export async function getNewToken (clientID, clientSecret, tenantId) {
  const tokenSet = await axios.post(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: `${clientID}`,
      scope: 'https://graph.microsoft.com/.default',
      client_secret: `${clientSecret}`,
      grant_type: 'client_credentials'
    })
  )
  return tokenSet.data.accessToken
}

// get list of apps used by the org
// async function getApps (access_token) {
//   const apps = await axios.get('https://graph.microsoft.com/v1.0/applications', {
//     headers: {
//       Authorization: `Bearer ${access_token}`
//     }
//   }).then(res => { return res.data.value }).catch(res => console.log(res))
//   const len_apps = apps.length
//   const finalAppDetails = []
//   for (let i = 0; i < len_apps; i++) {
//     const { appId, displayName } = apps[i]
//     const users = []
//     const len_user = apps[i].appRoles.length
//     for (let j = 0; j < len_user; j++) {
//       const { id, displayName } = apps[i].appRoles[j]
//       const userObject = { userID: id, userName: displayName }
//       users.push(userObject)
//     }
//     const appObject = { appID: appId, appName: displayName, users: users }
//     finalAppDetails.push(appObject)
//   }
//   for (const app of finalAppDetails) {
//     app.appName = app.appName.toLowerCase()
//   }
//   return finalAppDetails
// }
async function getApps (access_token) {
  const principal = await axios.get('https://graph.microsoft.com/v1.0/servicePrincipals', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  }).then(res => { return res.data.value }).catch(res => console.log(res))
  const apps = await axios.get('https://graph.microsoft.com/v1.0/applications', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  }).then(res => { return res.data.value }).catch(res => console.log(res))
  const len_apps = principal.length
  const finalAppDetails = []
  for (let i = 0; i < len_apps; i++) {
    const { id, appDisplayName } = principal[i]
    const users = []
    const Id = id
    for (const app of apps) {
      // eslint-disable-next-line eqeqeq
      if (app.displayName == appDisplayName) {
        const user_list = await axios.get(`https://graph.microsoft.com/v1.0/servicePrincipals/${Id}/appRoleAssignedTo`, {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        }).then(res => { return res.data.value }).catch(res => console.log(res))
        for (const user of user_list) {
          const { id, principalDisplayName } = user
          const userObject = { userID: id, userName: principalDisplayName }
          users.push(userObject)
        }
        const appObject = { appID: Id, appName: appDisplayName, users: users }
        finalAppDetails.push(appObject)
      }
    }
  }
  for (const app of finalAppDetails) {
    if (app.appName) app.appName = app.appName.toLowerCase()
    // console.log(app.appName)
  }
  return finalAppDetails
}
// getApps(access_token);

// get list of users in the org
async function getUsers (access_token) {
  const finalUserDetails = []
  const list = await axios.get('https://graph.microsoft.com/v1.0/users/', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  }).then(res => { return res.data.value }).catch(res => console.log(res))
  for (let i = 0; i < list.length; i++) {
    const { id, displayName, userPrincipalName, surname, givenName } = list[i]
    const dat = await axios.get(`https://graph.microsoft.com/v1.0/users/${list[i].id}/appRoleAssignments`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }).then(res => { return res.data.value }).catch(res => console.log(res))
    const apps = []
    for (let j = 0; j < dat.length; j++) {
      const { Id, resourceDisplayName } = dat[j]
      const appsObject = { appID: Id, appName: resourceDisplayName }
      apps.push(appsObject)
    }
    const userObject = { userID: id, firstname: givenName, lastname: surname, email: userPrincipalName, userName: displayName, apps: apps }
    finalUserDetails.push(userObject)
  }
  return finalUserDetails
}

export async function getSubs (orgID, sso_creds, ems_creds) {
  const filter = { ID: orgID }
  const subsData = await subSchema.findOne(filter)
  const subList = subsData.apps
  const appList = await getApps(sso_creds.access_token)

  for (const app of appList) {
    const emps = []
    // console.log(app.appName, ':', app)
    for (const user of app.users) {
      emps.push({
        id: user.userID,
        username: user.userName
      })
    }
    // console.log('actual emps', emps)
    const sso = {
      id: app.appID,
      name: 'azure'
    }
    let checkPresence = false
    for (const sub of subList) {
      // eslint-disable-next-line eqeqeq
      if (sub.name == app.appName) {
        // const updatedEmps = emps.concat(sub.emps)
        // emps = updatedEmps
        // console.log('before emps:', updatedEmps)
        let checkSsoPresence = false
        for (const origin of sub.sso) {
          // eslint-disable-next-line eqeqeq
          if (origin.name == 'azure') {
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
        if (sub.name == app.appName) {
          const updatedEmps = emps.concat(sub.emps)
          sub.emps = updatedEmps
          // sub.sso.push(sso)
          // console.log('after emps:', sub.sso)
          break
        }
      }
      continue
    }
    const ssoData = [sso]
    // console.log(app.appName, ' : ', emps)
    subList.push({
      sso: ssoData,
      name: app.appName,
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
  //     subData = await getXeroData(ems_creds.tenantID, ems_creds.access_token, subData)
  //     break
  //   case 'zoho':
  //     subData = await getZohoData(ems_creds.tenantID, ems_creds.access_token, subData)
  //     break
  // }
  const update = {
    apps: subList,
    amtSpent: subData.amtSpent,
    amtSaved: subData.amtSaved
  }
  await subSchema.findOneAndUpdate(filter, update)
  console.log('Azure subscription data updated successfully')
}

export async function getEmps (orgID, sso_creds) {
  const userList = []
  const empList = await getUsers(sso_creds.access_token)

  for (const emp of empList) {
    const appList = emp.apps
    const userAppList = []
    for (const app of appList) {
      userAppList.push({
        name: app.appName.toLowerCase(),
        id: app.appID
      })
    }
    userList.push({
      id: emp.userID,
      email: emp.email,
      firstname: emp.firstname,
      username: emp.userName,
      lastname: emp.lastname,
      apps: userAppList,
      source: 'azure'
    })
  }

  const filter = { ID: orgID }
  const orgData = await empSchema.findOne(filter)
  const empData = orgData.emps
  const updatedEmps = empData.concat(userList)
  const update = { emps: updatedEmps }
  await empSchema.findOneAndUpdate(filter, update)
  console.log('Azure employee data updated successfully')
}
// fetching azure group data
export async function getGroups (orgID, sso_creds) {
  const groups = []
  const response = await axios.get('https://graph.microsoft.com/beta/groups', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `bearer ${sso_creds.access_token}`
    }
  }).then(response => {
    return response.data.value
  })
    .catch(error => {
      console.error('There was an error!', error)
    })
  for (let i = 0; i < response.length; i++) {
    const name = response[i].displayName
    const { id } = response[i]
    const emps = []
    const res = await axios.get(`https://graph.microsoft.com/v1.0/groups/${id}/members`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `bearer ${sso_creds.access_token}`
      }
    }).then(res => {
      // console.log(res.data);
      return res.data.value
    })
      .catch(error => {
        // element.parentElement.innerHTML = `Error: ${error.message}`;
        console.error('There was an error!', error)
      })
    for (let j = 0; j < res.length; j++) {
      const { id } = res[j]
      const email = res[j].userPrincipalName
      const fname = res[j].givenName
      const lname = res[j].surname
      const userName = null
      const emp = { id: id, email: email, firstname: fname, username: userName, lastname: lname, source: 'azure' }
      emps.push(emp)
    }
    const resp = await axios.get(`https://graph.microsoft.com/beta/groups/${id}/members`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `bearer ${sso_creds.access_token}`
      }
    }).then(res => {
      return res.data.value
    })
      .catch(error => {
        console.error('There was an error!', error)
      })
    const apps = []
    for (let k = 0; k < resp.length; k++) {
      if (resp[k].appId) {
        const { appId } = resp[k]
        const appName = resp[k].appDisplayName
        const app = { id: appId, name: appName }
        apps.push(app)
      }
    }
    const group = { name: name, groupId: id, emps: emps, apps: apps, source: 'azure' }
    groups.push(group)
  }
  // console.log(groups)
  const filter = { ID: orgID }
  const orgData = await groupSchema.findOne(filter)
  const grpData = orgData.groups
  const updatedgrps = grpData.concat(groups)
  const update = { groups: updatedgrps }
  await groupSchema.findOneAndUpdate(filter, update)
  console.log('Azure group data updated successfully')
}

// create user

export async function createUser (sso, userInfo) {
  const data = JSON.stringify({
    accountEnabled: true,
    displayName: `${userInfo.displayName}`,
    mailNickname: `${userInfo.nickName}`,
    userPrincipalName: `${userInfo.email}`,
    passwordProfile: {
      forceChangePasswordNextSignIn: true,
      password: `${userInfo.password}`
    }
  })

  const config = {
    method: 'post',
    url: 'https://graph.microsoft.com/v1.0/users',
    headers: {
      Authorization: `Bearer ${sso.access_token}`,
      'Content-Type': 'application/json'
    },
    data: data
  }

  axios(config)
    .then(function (response) {
      // console.log(JSON.stringify(response.data))
      console.log('User created successfully')
    })
    .catch(function (error) {
      console.log(error)
    })
}

export async function deleteUser (sso, userInfo) {
  const config = {
    method: 'delete',
    url: `https://graph.microsoft.com/v1.0/users/${userInfo.userId}`,
    headers: {
      Authorization: `Bearer ${sso.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  axios(config)
    .then(function (response) {
      console.log('User deleted successfully')
    })
    .catch(function (error) {
      console.log(error)
    })
}
export async function addUserTogroup (sso, userInfo, groupInfo) {
  const data = JSON.stringify({
    '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${userInfo.userId}`
  })
  const config = {
    method: 'post',
    url: `https://graph.microsoft.com/v1.0/groups/${groupInfo.groupId}/members/$ref`,
    headers: {
      Authorization: `Bearer ${sso.accessToken}`,
      'Content-Type': 'application/json'
    },
    data: data
  }
  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data))
    })
    .catch(function (error) {
      console.log(error)
    })
}

export async function deleteUserFromGroup (sso, userInfo, grpInfo) {
  const config = {
    method: 'delete',
    url: `https://graph.microsoft.com/v1.0/groups/${grpInfo.groupId}/members/${userInfo.userId}/$ref`,
    headers: {
      Authorization: `Bearer ${sso.access_token}`,
      'Content-Type': 'application/json'
    }
  }
  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data))
    })
    .catch(function (error) {
      console.log(error)
    })
}

export async function addUserToApp (sso, userInfo, appInfo) {
  const data = JSON.stringify({
    id: '00000000-0000-0000-0000-000000000000',
    principalId: `${userInfo.userId}`,
    resourceId: `${appInfo.appId}`
  })
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://graph.microsoft.com/v1.0/${sso.tenantId}/users/${userInfo.userId}/appRoleAssignments`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  }
  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data))
    })
    .catch(function (error) {
      console.log(error)
    })
}

export async function deleteUserFromApp (sso, userInfo, appInfo) {
  const config = {
    method: 'delete',
    url: `https://graph.microsoft.com/v1.0/servicePrincipals/${appInfo.appId}/appRoleAssignments/${userInfo.userId}`,
    headers: {
      Authorization: `Bearer ${sso.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data))
    })
    .catch(function (error) {
      console.log(error)
    })
}
