const axios = require("axios")

async function getAppList(envID, ping_access_token){
    const options = {
        'method': 'GET',
        'url': `https://api.pingone.asia/v1/environments/${envID}/applications`,
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

async function getEmployees(envID, ping_access_token){
    const options = {
        'method': 'GET',
        'url': `https://api.pingone.asia/v1/environments/${envID}/users`,
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
    console.log(userList)
    return userList
}

async function getEmployeesApps(envID, ping_access_token, userID){
    let options = {
        'method': 'GET',
        'url': `https://api.pingone.asia/v1/environments/${envID}/users/${userID}/memberOfGroups?limit=100&expand=group`,
        'headers': {
            'Authorization': `Bearer ${ping_access_token}`
        }
    }

    let res = await axios.request(options)
    let groupList = []
    res.data._embedded.groupMemberships.forEach(group => {
        groupList.push(group.id)
    })
    const appList = await getEmployees(envID, ping_access_token)

    let userApps = []

    groupList.forEach(group =>{
        appList.forEach(appGroup =>{
            appGroup.forEach(grp =>{
                if(group == grp.id)
                    userApps.push(appGroup.name)
            }) 
        })
    })

    return userApps
}

async function deleteUser(envID, ping_access_token, userID){
    //delete function is messed up
}

