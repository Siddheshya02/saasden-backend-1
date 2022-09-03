const axios = require('axios')
const subSchema = require('../../../models/subscription')
const empSchema = require('../../../models/employee')

async function getToken (subdomain, client_id, client_secret) {
  const res = await axios.post(`https://${subdomain}.onelogin.com/auth/oauth2/v2/token`, {
    client_id,
    client_secret,
    grant_type: 'client_credentials'
  }, {
    'Content-Type': 'application/x-www-form-urlencoded'
  })
  return res.data
}

async function getoneLoginApps (subdomain, accessToken) {
  const res = await axios.post(`https://${subdomain}/api/2/apps`, {}, {
    Authorization: `Bearer ${accessToken}`
  })
  res.data.forEach(app => {
    app.name = app.name.toLowerCase()
  })
  return res.data
}

async function getOneLoginUsers (subdomain, accessToken) {
  const res = axios.get(`https://${subdomain}/api/2/users`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  return res.data
}

async function getOneLoginUserApps (userID, subdomain, accessToken) {
  const res = await axios.get(`https://${subdomain}/api/2/users/${userID}/apps`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  return res.data
}

function getSubs (subdomain, accessToken, user_saasden_id) {
  getoneLoginApps(subdomain, accessToken).then(appList => {
    const promiseList = []
    const subList = []
    appList.forEach(app => {
      promiseList.push(
        axios.get(`https://${subdomain}/api/2/apps/${app.id}/users`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
      )
      subList.push({
        id: app.id,
        name: app.name,
        emps: []
      })
    })
    Promise.all(promiseList).then(res => {
      for (let i = 0; i < res.length; i++) {
        subList[i].emp.push({
          id: res.data.id,
          email: res.data.email,
          firstname: res.data.firstname,
          lastname: res.data.lastname,
          username: res.data.username
        })
      }
    }).then(async () => {
      await subSchema.insertOne({
        user_saasden_id,
        apps: subList
      })
    }).catch(error => {
      console.log(error)
    })
  }).catch(error => {
    console.log(error)
  })
}

function getEmps (subdomain, accessToken, user_saasden_id) {
  const emps = []
  getOneLoginUsers(subdomain, accessToken).then(empList => {
    empList.forEach(emp => {
      const userAppList = []
      getOneLoginUserApps(emp.id, subdomain, accessToken).then(appList => {
        appList.forEach(app => {
          userAppList.push([
            app.id,
            app.name.toLowerCase()
          ])
        })

        emps.push({
          id: emp.id,
          email: emp.email,
          firstname: emp.firstname,
          userName: emp.username,
          lastname: emp.lastname,
          apps: userAppList
        })
      }).catch(error => {
        console.log(error)
      })
    })
  }).then(async () => {
    empSchema.insertOne({
      user_saasden_id,
      emps
    })
    console.log('DB Updated successfuly for OneLogin')
  }).catch(error => {
    console.log(error)
  })
}

module.exports = { getToken, getSubs, getEmps }
