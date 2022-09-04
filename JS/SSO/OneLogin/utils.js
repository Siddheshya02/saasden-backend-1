const axios = require('axios')
const subModel = require('../../../models/subscription')
const empModel = require('../../../models/employee')

async function getToken (subDomain, client_id, client_secret) {
  const res = await axios.post(`https://${subDomain}/auth/oauth2/v2/token`, {
    client_id: client_id,
    client_secret: client_secret,
    grant_type: 'client_credentials'
  }, {
    'Content-Type': 'application/x-www-form-urlencoded'
  })
  return res.data.access_token
}

async function getoneLoginApps (subDomain, accessToken) {
  const OneLoginoptions = {
    method: 'GET',
    uri: `https://${subDomain}/api/2/apps`,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }
  const response = await axios.request(`https://${subDomain}/api/2/apps`, OneLoginoptions)
  const apps = response.data
  apps.forEach(element => {
    element.name = element.name.toLowerCase()
  })
  return apps
}

async function getOneLoginUsers (subDomain, accessToken) {
  const OneLoginoptions = {
    method: 'GET',
    uri: `https://${subDomain}/api/2/users`,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }
  const response = await axios.request(`https://${subDomain}/api/2/users`, OneLoginoptions)
  const emps = response.data
  return emps
}

async function getOneLoginUserApps (userID, subDomain, accessToken) {
  const res = await axios.get(`https://${subDomain}/api/2/users/${userID}/apps`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  return res.data
}

async function getSubs (subDomain, accessToken, user_saasden_id) {
  const appList = await getoneLoginApps(subDomain, accessToken)
  const subList = []
  for (const app of appList) {
    const options = {
      method: 'GET',
      uri: `https://${subDomain}/api/2/apps/${app.id}/users`,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
    const res = await axios.request(`https://${subDomain}/api/2/apps/${app.id}/users`, options)
    const emps = []
    for (const user of res.data) {
      const { id, firstname, lastname, email, username } = user
      emps.push({
        id,
        firstname,
        lastname,
        username,
        email
      })
    }
    subList.push({
      id: app.id,
      name: app.name,
      emps
    })
  }
  const filter = { user_saasden_id: user_saasden_id }
  const update = { apps: subList }
  await subModel.findOneAndUpdate(filter, update)
}

async function getEmps (subDomain, accessToken, user_saasden_id) {
  const empList = await getOneLoginUsers(subDomain, accessToken)
  const userList = []
  for (const emp of empList) {
    const appList = await getOneLoginUserApps(emp.id, subDomain, accessToken)
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
  const filter = { user_saasden_id: user_saasden_id }
  const update = { emps: userList }
  await empModel.findOneAndUpdate(filter, update)
}

module.exports = { getToken, getSubs, getEmps }
