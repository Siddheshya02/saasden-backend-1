const axios=require('axios')

const subSchema = require("../../../models/subscription")
const empSchema = require("../../../models/employee")

async function getApps(apiToken){
    const res = await axios.get('https://console.jumpcloud.com/api/applications', {}, {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': `${apiToken}`
    })
    return res.data.results
}

async function getUsers(apiToken){
    const res = await axios.get('https://console.jumpcloud.com/api/systemusers', {}, {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': `${apiToken}`
    })

    return res.data.results
}

async function getUserData(apiToken, userID){
    const res = await axios.get(`https://console.jumpcloud.com/api/systemusers/${userID}`, {}, {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': `${apiToken}`
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
    const res = await axios.get(`https://console.jumpcloud.com/api/v2/applications/${appID}/users`, {}, {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': `${apiToken}`
    })

    let userList = []
    res.data.forEach(user => {
        getUserData(apiToken, user.id).then(userData => {
            userList.push(userData)
        })
    })
    return userList
}

async function getUserApps(userID, apiToken, appMap){    
    const res = await axios.get(`https://console.jumpcloud.com/api/v2/users/${userID}/applications`, {}, {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': `${apiToken}`
    })
    
    let appList = []
    
    res.data.forEach(app => {
        appList.push({
            id : app.id,
            name: appMap[app.id],
        })
    })
        
    return appList
}

function getSubs(apiToken, user_saasden_id){
    getApps(apiToken).then(appList => {
        let subList = []
        appList.forEach(app => {
            getAppUsers(app.id, apiToken).then(emps => {
                subList.push({
                    id : app.id,
                    name: app.name,
                    emps: emps 
                })
            }).catch(error => {
                console.log(error)
            })
        })
    }).then(async() => {
        await subSchema.insertOne({
            user_saasden_id: user_saasden_id,
            apps: subList,
        })
        console.log("Jumpcloud Subscription data updated successfully")
    }).catch(error => {
        console.log(error)
    })
}

function getEmps(apiToken, user_saasden_id){
    const apps = await getApps(apiToken)
    let appMap={}
    apps.forEach(app => {
        appMap[app.id]=app.name
    })

    getUsers(apiToken).then(userList => {
        let empList = []
        userList.forEach(user => {
            getUserApps(user.id, apiToken, appMap).then(appList => {
                empList.push({
                    id: user.id,
                    email: user.email,
                    firstname: user.firstname,
                    username: user.username,
                    lastname: user.lastname,
                    apps: appList
                })
            })
        })
    }).then(async()=>{
        await empSchema.insertOne({
            user_saasden_id: user_saasden_id,
            emps: emps
        })
        console.log("JumpCloud employee data updated Succesfully")
    }).catch(error=>{
        console.log(error)
    })
}


module.exports = {getSubs, getEmps}