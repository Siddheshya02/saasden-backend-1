const axios = require('axios')
const subModel = require('../../../models/subscription')
const empModel = require('../../../models/employee')

// Get List of Applications with their associated groups
async function getPingApps (envID, accessToken) {
  const appList = []
  try {
    const res = await axios.get(`https://api.pingone.eu/v1/environments/${envID}/applications`, {
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
async function getPingEmployees (envID, accessToken) {
  try {
    const res = await axios.get(`https://api.pingone.eu/v1/environments/${envID}/users`, {
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
async function getUsers (envID, accessToken, groupList) {
  const userList = []
  for (const group of groupList) {
    try {
      const res = await axios.get(`https://api.pingone.eu/v1/environments/${envID}/users?filter=memberOfGroups[id%20eq%20%22${group.id}%22]`, {
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

// Get list of all apps along with their associted users
async function getSubs (envID, accessToken, saasdenID) {
  const subList = []
  const appList = await getPingApps(envID, accessToken)

  for (const app of appList) {
    const res = await getUsers(envID, accessToken, app[3])
    subList.push({
      name: app[1],
      ssoID: app[0],
      emps: res
      // data to be fetched from EMS
      // emsID: String,
      // licences: Number,
      // currentCost: Number,
      // amountSaved: Number,
      // dueData: String
    })
  }
  const filter = { saasdenID: saasdenID }
  const update = { apps: subList }
  await subModel.findOneAndUpdate(filter, update)
  console.log('PingOne subscription data saved successfully')
}

// Get list of all employees along with their associated apps
async function getEmps (envID, accessToken, saasdenID) {
  const appList = await getPingApps(envID, accessToken)
  const userList = await getPingEmployees(envID, accessToken)

  for (let i = 0; i < userList.length; i++) {
    const groupList = []
    const res = await axios.get(`https://api.pingone.eu/v1/environments/${envID}/users/${userList[i].id}/memberOfGroups?limit=100&expand=group`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
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
  const filter = { saasdenID: saasdenID }
  const update = { emps: userList }
  await empModel.findOneAndUpdate(filter, update)
  console.log('PingOne Emp data saved successfully')
}

module.exports = { getSubs, getEmps }
