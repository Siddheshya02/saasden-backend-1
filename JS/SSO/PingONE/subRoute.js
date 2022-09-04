const axios = require('axios')

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
async function getSubs (envID, accessToken) {
  const subList = []
  const appList = await getPingApps(envID, accessToken)

  for (const app of appList) {
    const res = await getUsers(envID, accessToken, app[3])
    subList.push({
      ssoID: app[0],
      status: app[2],
      name: app[1],
      emps: res
    })
  }
  console.log(subList)
}

module.exports = { getPingApps, getSubs }
