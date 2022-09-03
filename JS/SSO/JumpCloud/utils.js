const axios=require('axios')
const subSchema = require("../../../models/subscription")
const empSchema = require("../../../models/employee")

async function getApps(apiToken){
    const res = await axios.get('https://console.jumpcloud.com/api/applications', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': `${apiToken}`
        }
    })
    return res.data.results
}

async function getUsers(apiToken){
    const res = await axios.get('https://console.jumpcloud.com/api/systemusers', {
        headers:{
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': `${apiToken}`
        }
    })
    return res.data.results
}

async function getUserData(apiToken, userID){
    const res = await axios.get(`https://console.jumpcloud.com/api/systemusers/${userID}`, {
        headers:{
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': `${apiToken}`
        }
    })
    let userData = res.data
    return {
        id: userData.id,
        email: userData.email,
        firstname: userData.firstname,
        username: userData.username,
        lastname: userData.lastname,
    }
}

async function getAppUsers(appID, apiToken){
    const res = await axios.get(`https://console.jumpcloud.com/api/v2/applications/${appID}/users`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': `${apiToken}`
        }
    })

    const userList=[];
    for (const user of res.data) {
        const userData=await getUserData(apiToken, user.id)
        userList.push(userData)
    }
    return userList
}

async function getUserApps(userID, apiToken, appMap){    
    const res = await axios.get(`https://console.jumpcloud.com/api/v2/users/${userID}/applications`, {
        headers:{
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': `${apiToken}`
        }
    })
    
    let appList = []
    for (const app of res.data) {
        appList.push({
            id : app.id,
            name: appMap[app.id],
        })
    }
    return appList
}

async function getSubs(apiToken, user_saasden_id){
    let subList = []
    const appList=await getApps(apiToken)
    for (const app of appList) {
        const emps=await getAppUsers(app.id,apiToken)
        subList.push({
            id : app.id,
            name: app.name,
            emps: emps 
        })
    }
    return subList
}

async function getEmps(apiToken, user_saasden_id){
    const apps = await getApps(apiToken)
    let appMap={}
    apps.forEach(app => {
        appMap[app.id]=app.name
    })

    let empList = []
    const userList=await getUsers(apiToken)
    for (const user of userList) {
        const appList=await getUserApps(user.id,apiToken,appMap)
        empList.push({
            id: user.id,
            email: user.email,
            firstname: user.firstname,
            username: user.username,
            lastname: user.lastname,
            apps: appList
        })
    }
    return empList
}
async function test()
{
    const testResult=await getEmps('ccbc361c249d05245e00394f9f4d201771a61335','12')
    console.log(testResult[0].apps)
}
test()
module.exports = {getSubs, getEmps}