/* eslint-disable eqeqeq */
import axios from 'axios'
import { google } from 'googleapis'
import subSchema from '../../../models/subscription.js'
import empSchema from '../../../models/employee.js'
import groupSchema from '../../../models/groups.js'
import { subMonths } from 'date-fns'
export function getoauth2Client (client_id, client_secret) {
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'https://saasden.club/loading-gsuite'
  )
  return oauth2Client
}
export async function getAuthorizationUrl (client_id, client_secret) {
  const scopes = [
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/admin.reports.usage.readonly',
    'https://www.googleapis.com/auth/apps.licensing',
    'https://www.googleapis.com/auth/admin.reports.audit.readonly',
    'https://www.googleapis.com/auth/admin.directory.user.security',
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/admin.directory.domain',
    'https://www.googleapis.com/auth/admin.directory.domain.readonly',
    'https://apps-apis.google.com/a/feeds/groups/',
    'https://www.googleapis.com/auth/admin.directory.group'
  ]
  const oauth2Client = getoauth2Client(client_id, client_secret)
  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true
  })
  return authorizationUrl
}
export async function getGsuiteToken (code, client_id, client_secret) {
  const oauth2Client = getoauth2Client(client_id, client_secret)
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)
  return tokens.access_token
}
export async function getApps (access_token, customerId) {
  const curDate = new Date().toISOString().split('T')[0]
  const apps = axios.get(`https://admin.googleapis.com/admin/reports/v1/usage/dates/2022-12-21?customerId=${customerId}}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: 'application/json'
    }
  }).then(function (response) {
    console.log(JSON.stringify(response.data))
    // console.log('User created sucessfully')
  })
    .catch(function (error) {
      console.log(error.response.data.error)
    })
  const appList1 = []
  for (const report of apps.data.usageReports) {
    for (const parameter of report.parameters) {
      // eslint-disable-next-line eqeqeq
      if (parameter.name == 'accounts:authorized_apps') {
        for (const value of parameter.msgValue) {
          appList1.push({ name: value.client_name, users: value.num_users })
        }
      }
    }
  }
  const date = new Date()
  const newDate = subMonths(date, 4)
  const apps2 = await axios.get(`https://admin.googleapis.com/admin/reports/v1/activity/users/all/applications/token?endTime=${date}&startTime=${newDate}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: 'application/json'
    }
  })
  const directoryUsers = new Set()
  const userList = await axios.get(`https://admin.googleapis.com/admin/directory/v1/users?customer=${customerId}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: 'application/json'
    }
  })
  const activeUsers = []
  for (const user of userList.data.users) {
    if (!directoryUsers.has(user.primaryEmail)) {
      directoryUsers.add(user.primaryEmail)
      const userInfo = { email: user.primaryEmail, username: user.name.fullName }
      activeUsers.push(userInfo)
    }
  }
  const appList2 = []
  for (const item of apps2.data.items) {
    if (!directoryUsers.has(item.actor.email)) {
      continue
    }
    const appsUsed = []
    for (const event of item.events) {
      appsUsed.push(event.parameters[1].value)
    }
    for (let i = 0; i < activeUsers.length; i++) {
      if (activeUsers[i].email == item.actor.email) {
        appList2.push({ email: item.actor.email, apps: appsUsed, username: activeUsers[i].username })
        break
      }
    }
  }
  return { appList1, appList2 }
}
export async function getEmps (appList1, appList2, orgID) {
  const appSet = new Set()
  for (const app of appList1) {
    appSet.add(app.name)
  }

  const emailSet = new Set()
  const Maps = new Map()
  for (const data of appList2) {
    if (emailSet.has(data.email)) {
      Maps.get(data.email).add(data.apps[0])
    } else {
      const apps = new Set()
      apps.add(data.apps[0])
      emailSet.add(data.email)
      Maps.set(data.email, apps)
    }
  }
  const empList = []
  Maps.forEach(function (value, key) {
    const emp = { email: null, apps: [], source: 'gsuite', firstname: null }
    emp.email = key
    for (const user of appList2) {
      if (user.email == key) {
        emp.firstname = user.username
        break
      }
    }
    const apps = Array.from(value)
    for (const app of apps) {
      emp.apps.push({ name: app })
    }
    empList.push(emp)
  })
  const filter = { ID: orgID }
  const orgData = await empSchema.findOne(filter)
  const empData = orgData.emps
  const updatedEmps = empData.concat(empList)
  const update = { emps: updatedEmps }
  await empSchema.findOneAndUpdate(filter, update)
  console.log('Gsuite employee data updated successfully')
}
export async function getSubs (appList1, appList2, orgID) {
  const filter = { ID: orgID }
  const subsData = await subSchema.findOne(filter)
  const appSet = new Set()
  for (const app of appList1) {
    appSet.add(app.name)
  }
  const emailSet = new Set()
  const Maps = new Map()
  for (const data of appList2) {
    if (emailSet.has(data.email)) {
      Maps.get(data.email).add(data.apps[0])
    } else {
      const apps = new Set()
      apps.add(data.apps[0])
      emailSet.add(data.email)
      Maps.set(data.email, apps)
    }
  }
  const appList = Array.from(appSet)
  const subList = subsData.apps
  //   console.log('gsuite', subList)
  for (const app of appList) {
    // const sub = { name: app, emps: [] }
    const emps = []
    const empSet = new Set()
    Maps.forEach(async function (value, key) {
      if (value.has(app)) {
        if (!empSet.has(key)) {
          const emp = { email: key, firstname: null, source: 'gsuite' }
          for (const user of appList2) {
            if (user.email == key) {
              emp.firstname = user.username
              break
            }
          }
          emps.push(emp)
          empSet.add(key)
        }
      }
    })
    const sso = {
      id: null,
      name: 'gsuite'
    }
    let checkPresence = false
    for (const sub of subList) {
      // eslint-disable-next-line eqeqeq

      if (sub.name == app) {
        let checkSsoPresence = false
        for (const origin of sub.sso) {
          // eslint-disable-next-line eqeqeq
          if (origin.name == 'gsuite') {
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
        if (sub.name == app) {
          const updatedEmps = emps.concat(sub.emps)
          sub.emps = updatedEmps
          break
        }
      }
      continue
    }
    const ssoData = [sso]
    // console.log(app.name, ' : ', emps)
    if (emps.length == 0) {
      continue
    }
    subList.push({
      sso: ssoData,
      name: app,
      emps: emps,
      // ems data to be updated
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
  const update = {
    apps: subList,
    amtSpent: subData.amtSpent,
    amtSaved: subData.amtSaved
  }
  await subSchema.findOneAndUpdate(filter, update)
  console.log('Gsuite subscription data updated successfully')
  return subList
}
export async function getGroups (orgID, access_token, customerId, appList2) {
  const groups = []
  const data = await axios.get(`https://admin.googleapis.com/admin/directory/v1/groups?customer=${customerId}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: 'application/json'
    }
  }).then(res => { return res.data })
  for (const grp of data.groups) {
    const name = grp.name
    const { id } = grp
    const emps = []
    const Emp = await axios.get(`https://admin.googleapis.com/admin/directory/v1/groups/${id}/members`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json'
      }
    }).then(res => { return res.data.members })
    for (const e of Emp) {
      const { id } = e
      const { email } = e
      let fname = null
      const lname = null
      const userName = null
      for (const user of appList2) {
        if (user.email == email) {
          fname = user.username
          break
        }
      }
      const emp = { id: id, email: email, firstname: fname, username: userName, lastname: lname }
      emps.push(emp)
    }
    const group = { name: name, groupId: id, emps: emps, source: 'gsuite' }
    groups.push(group)
  }
  const filter = { ID: orgID }
  const orgData = await groupSchema.findOne(filter)
  const grpData = orgData.groups
  const updatedgrps = grpData.concat(groups)
  const update = { groups: updatedgrps }
  await groupSchema.findOneAndUpdate(filter, update)
  console.log('Gsuite group data updated successfully')
}
export async function createUser (userInfo, access_token) {
  const response = axios.post(
    'https://admin.googleapis.com/admin/directory/v1/users', {
      name: {
        familyName: `${userInfo.familyName}`,
        givenName: `${userInfo.givenName}`
      },
      password: `${userInfo.password}`,
      primaryEmail: `${userInfo.email}`
    }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json'
      }
    }
  ).then(function (response) {
    // console.log(JSON.stringify(response.data))
    console.log('User created sucessfully')
  })
    .catch(function (error) {
      console.log(error.response.data.error)
    })
}
export async function deleteUser (userInfo, access_token) {
  const response = await axios.delete(
            `https://admin.googleapis.com/admin/directory/v1/users/${userInfo.email}`, {
              headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json'
              }
            }
  ).then(function (response) {
    // console.log(JSON.stringify(response.data))
    console.log('User deleted sucessfully')
  })
    .catch(function (error) {
      console.log(error.response.data.error)
    })
}
export async function addUserTogroup (access_token, userInfo, grpInfo) {
  const response = await axios.post(
  `https://admin.googleapis.com/admin/directory/v1/groups/${grpInfo.id}/members`, {
    role: 'MEMBER',
    email: `${userInfo.id}`
  }, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: 'application/json'
    }
  }
  ).then(function (response) {
    // console.log(JSON.stringify(response.data))
    console.log('Succefully added user to group')
  })
    .catch(function (error) {
      console.log(error.response.data.error)
    })
}
export async function deleteUserFromGroup (access_token, userInfo, grpInfo) {
  const response = await axios.delete(
            `https://admin.googleapis.com/admin/directory/v1/groups/${grpInfo.id}/members/${userInfo.email}`, {
              headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json'
              }
            }
  ).then(function (response) {
    // console.log(JSON.stringify(response.data))
    console.log('Successfully deleted user from group')
  })
    .catch(function (error) {
      console.log(error.response.data.error)
    })
}
