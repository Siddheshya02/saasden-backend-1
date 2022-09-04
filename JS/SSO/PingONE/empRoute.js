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
        userID: user.id,
        name: user.name.formatted
      })
    }
    return userList
  } catch (error) {
    console.log(error)
  }
}

// Get list of all employees along with their associated apps
async function getEmpApps (envID, accessToken, userID) {
  const groupList = []
  const appList = await getPingApps(envID, accessToken)
  const userList = await getPingEmployees(envID, accessToken)


  for(user of userList){
    
  }


  const res = await axios.get(`https://api.pingone.eu/v1/environments/${envID}/users/${userID}/memberOfGroups?limit=100&expand=group`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  for (const group of res.data._embedded.groupMemberships) {
    groupList.push(group.id)
  }

  res.data._embedded.groupMemberships.forEach(group => {
    groupList.push(group.id)
  })

  const userApps = []
  groupList.forEach(group => {
    appList.forEach(appGroup => {
      appGroup[2].forEach(grp => {
        if (group === grp.id) {
          userApps.push({
            appID: appGroup[0],
            appName: appGroup[1]
          })
        }
      })
    })
  })
  return userApps
}
