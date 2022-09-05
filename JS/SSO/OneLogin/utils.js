const axios = require('axios')
const subModel = require('../../../models/subscription')
const empModel = require('../../../models/employee')

// get onelogin access token
async function getToken (domain, clientID, clientSecret) {
  const res = await axios.post(`https://${domain}/auth/oauth2/v2/token`, {
    client_id: clientID,
    client_secret: clientSecret,
    grant_type: 'client_credentials'
  }, {
    'Content-Type': 'application/x-www-form-urlencoded'
  })
  console.log('access token generated')
  return res.data.access_token
}

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

async function getSubs (domain, accessToken, saasdenID) {
  const subList = []
  const appList = await getApps(domain, accessToken)

  for (const app of appList) {
    const res = await axios.get(`https://${domain}/api/2/apps/${app.id}/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
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
      emps: emps
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
  console.log('OneLogin subscription data updated successfully')
}

async function getEmps (domain, accessToken, saasdenID) {
  const userList = []
  const empList = await getUsers(domain, accessToken)

  for (const emp of empList) {
    const appList = await getUserApps(emp.id, domain, accessToken)
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

  const filter = { saasdenID: saasdenID }
  const update = { emps: userList }
  await empModel.findOneAndUpdate(filter, update)
  console.log('OneLogin employee data updated successfully')
}

module.exports = { getToken, getSubs, getEmps }
