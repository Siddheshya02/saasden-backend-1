const axios = require('axios')
const subModel = require('../../../models/subscription')
const empModel = require('../../../models/employee')

async function getApps (apiToken) {
  const res = await axios.get('https://console.jumpcloud.com/api/applications', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${apiToken}`
    }
  })
  return res.data.results
}

async function getUsers (apiToken) {
  const res = await axios.get('https://console.jumpcloud.com/api/systemusers', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${apiToken}`
    }
  })
  return res.data.results
}

async function getUserData (apiToken, userID) {
  const res = await axios.get(`https://console.jumpcloud.com/api/systemusers/${userID}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${apiToken}`
    }
  })
  const userData = res.data
  return {
    id: userData.id,
    email: userData.email,
    firstname: userData.firstname,
    username: userData.username,
    lastname: userData.lastname
  }
}

async function getAppUsers (appID, apiToken) {
  const res = await axios.get(`https://console.jumpcloud.com/api/v2/applications/${appID}/users`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${apiToken}`
    }
  })

  const userList = []
  for (const user of res.data) {
    const userData = await getUserData(apiToken, user.id)
    userList.push(userData)
  }
  return userList
}

async function getUserApps (userID, apiToken, appMap) {
  const res = await axios.get(`https://console.jumpcloud.com/api/v2/users/${userID}/applications`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': `${apiToken}`
    }
  })

  const appList = []
  for (const app of res.data) {
    appList.push({
      ssoID: app.id,
      name: appMap[app.id]
      // data to be fetched from EMS
      // emsID: String,
      // licences: Number,
      // currentCost: Number,
      // amountSaved: Number,
      // dueData: String
    })
  }
  return appList
}

async function getSubs (apiToken, saasdenID) {
  const subList = []
  const appList = await getApps(apiToken)
  for (const app of appList) {
    const emps = await getAppUsers(app.id, apiToken)
    subList.push({
      id: app.id,
      name: app.name,
      emps
    })
  }
  const filter = { saasdenID: saasdenID }
  const update = { apps: subList }
  await subModel.findOneAndUpdate(filter, update)
  console.log('Jumpcloud subscription data updated successfully')
  return subList
}

async function getEmps (apiToken, saasdenID) {
  const apps = await getApps(apiToken)
  const appMap = {}
  apps.forEach(app => {
    appMap[app.id] = app.name
  })

  const empList = []
  const userList = await getUsers(apiToken)
  for (const user of userList) {
    const appList = await getUserApps(user.id, apiToken, appMap)
    empList.push({
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      username: user.username,
      lastname: user.lastname,
      apps: appList
    })
  }
  const filter = { saasdenID: saasdenID }
  const update = { emps: userList }
  await empModel.findOneAndUpdate(filter, update)
  console.log('Jumpcloud employee data updated successfully')
}

module.exports = { getSubs, getEmps }
