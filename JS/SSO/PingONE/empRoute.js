const axios = require("axios")

async function getPingAppList(envID, ping_access_token){
    const options = {
        'method': 'GET',
        'url': `https://api.pingone.eu/v1/environments/${envID}/applications`,
        'headers': {
           'Authorization': `Bearer ${ping_access_token}`
        }
    }
    let appList = []
    try {
        let res = await axios.request(options)
        res.data._embedded.applications.forEach(app => {
            if(app.accessControl && app.accessControl.group)
                appList.push([
                    app.id, 
                    app.name, 
                    app.accessControl.group.groups
                ])
        });
        return appList
    } catch (error) {
        console.log(error)
    }
}

async function getPingEmployees(envID, ping_access_token){
    const options = {
        'method': 'GET',
        'url': `https://api.pingone.eu/v1/environments/${envID}/users`,
        'headers': {
           'Authorization': `Bearer ${ping_access_token}`
        }
    }
    const res = await axios.request(options)
    let userList = []
    res.data._embedded.users.forEach(user => {
        userList.push({
            userID: user.id,
            name: user.name.formatted
        })
    });
    return userList
}

async function getEmployeesApps(envID, ping_access_token, userID){
    let options = {
        'method': 'GET',
        'url': `https://api.pingone.eu/v1/environments/${envID}/users/${userID}/memberOfGroups?limit=100&expand=group`,
        'headers': {
            'Authorization': `Bearer ${ping_access_token}`
        }
    }

    let res = await axios.request(options)
    let groupList = []
    res.data._embedded.groupMemberships.forEach(group => {
        groupList.push(group.id)
    })

    const appList = await getPingAppList(envID, ping_access_token)
    let userApps = []
    groupList.forEach(group =>{
        appList.forEach(appGroup =>{
            appGroup[2].forEach(grp =>{
                if(group == grp.id)
                    userApps.push({
                        appID: appGroup[0],
                        appName: appGroup[1]
                    })
            }) 
        })
    })
    return userApps
}

var token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImRlZmF1bHQifQ.eyJjbGllbnRfaWQiOiI2YzI0NGZiZS1hZGMwLTQzODgtYjY0NC05Y2ZlODg1ZGYyYmMiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5ldS8wMzlmZWNiYi1lMjljLTQxNGItYTc2My1mODA1MmQ1YWViNDMvYXMiLCJpYXQiOjE2NjEwODc4NjEsImV4cCI6MTY2MTA5MTQ2MSwiYXVkIjpbImh0dHBzOi8vYXBpLnBpbmdvbmUuZXUiXSwiZW52IjoiMDM5ZmVjYmItZTI5Yy00MTRiLWE3NjMtZjgwNTJkNWFlYjQzIiwib3JnIjoiNGYwZTI4ZGEtMzJjZS00N2Q2LWIxNDUtOTI1MTJhMzUzZmYwIn0.WTvMd1d40w1xFil0LHtXeweQrOk0WaXlnDIEmiOPot28LkyT2YK4VnoiBYY_YUIoH9JuKofBjELEi7U4d9p0Bugn947rV8-iYKwXGzmD_JXTtIokHxovZxDJZ6ony4Di-HrvIrWUxEA5j6VyBjLLTy2j2cWyHa_uZ0_wX7XItXBG8SBKll71PxVXTa7PRzDczy-6FLj3diV4Mx_Pu2x6XcajXpL91lylg0oYn2R-U5Kb0i9JkMv8klcOl9cx303GsutGWuXRuQ4cbRJ1ufjNscw9cO7mfw6uWfRoq2yusfLEbTJUmR6xzJkg08puylw27IRieQKg0KCT4aZ_7lD8yw'
var env = '039fecbb-e29c-414b-a763-f8052d5aeb43'

getEmployeesApps(env, token, 'ae84ac4d-be79-4f01-b792-e21db2bde07a').then(data =>{
    console.log(data)
}).catch(error=>{
    console.log(error)
})