const axios = require('axios')
const subModel = require('../../../models/subscription')
const empModel = require('../../../models/employee')

// get list of applications
async function getApps (subdomain, apiToken) {
  const res = await axios.get(`https://${subdomain}/api/v1/apps`, {
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
async function getUsers (subDomain, apiToken) {
  const res = await axios.get(`https://${subDomain}/api/v1/users`, {
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
async function getSubs (subDomain, apiToken, saasdenID) {
  try {
    const appData = await getApps(subDomain, apiToken)
    const subList = []
    for (const app of appData) {
      console.log('running for ' + app[1])
      const userData = await axios.get(app[3], {
        headers: {
          Authorization: `SSWS ${apiToken}`,
          'Content-Type': 'application/json'
        }
      })
      const empList = []
      for (const user of userData.data) {
        empList.push({
          id: user.id,
          email: user.profile.email,
          firstname: user.profile.firstName,
          lastname: user.profile.lastName,
          username: user.profile.email
        })
      }

      subList.push({
        name: app[1],
        ssoID: app[0],
        emsID: 'emsID goes here',
        emps: empList
      })
    }
    const filter = { saasdenID: saasdenID }
    const update = { apps: subList }
    await subModel.findOneAndUpdate(filter, update)
    console.log('Okta subscription data updated successfully')
  } catch (error) {
    console.log(error)
  }
}

// get user -> app mapping
async function getEmps (subDomain, apiToken, saasdenID) {
  try {
    const userList = await getUsers(subDomain, apiToken)
    for (const user of userList) {
      const appList = await axios.get(`https://${subDomain}/api/v1/apps?filter=user.id+eq+"${user.id}"`, {
        headers: {
          Authorization: `SSWS ${apiToken}`,
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
    const filter = { saasdenID: saasdenID }
    const update = { emps: userList }
    await empModel.findOneAndUpdate(filter, update)
  } catch (error) {
    console.log(error)
  }
}

module.exports = { getSubs, getEmps }
