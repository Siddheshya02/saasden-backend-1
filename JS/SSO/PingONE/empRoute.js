const axios = require("axios")

//get list of all apps along with their associated group ids
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

//Get list of all employees
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

//Get list of all employees along with their associated apps
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