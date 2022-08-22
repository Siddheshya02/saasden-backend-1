const axios = require("axios")

//Get List of Applications with their associated groups
async function getPingApps(envID, ping_access_token){
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
                    app.enabled,
                    app.accessControl.group.groups
                ])
        });
        return appList
    } catch (error) {
        console.log(error)
    }
}

//Get List of users and the groupIDS they are part of 
async function getUsers(envID, ping_access_token, groupIDs){
    let promiseList = []
    let userList = []
    groupIDs.forEach(groupID => {
        let options = {
            'method': 'GET',
            'url': `https://api.pingone.eu/v1/environments/${envID}/users?filter=memberOfGroups[id%20eq%20%22${groupID.id}%22]`,
            'headers': {
                'Authorization': `Bearer ${ping_access_token}`
            }
        };
        promiseList.push(axios.request(options))
    });

    return Promise.all(promiseList).then(data => {
        data.forEach(res => {
            res.data._embedded.users.forEach(user => {
                userList.push({
                    id: user.id,
                    userName:user.name.formatted,
                    status: user.enabled
                })
            });
        })
    }).then(()=>{
        return [...new Set(userList)]
    }).catch(error =>{
        console.log(error)
    })
}

//Get list of all apps along with their associted users
async function getSubData(envID, ping_access_token){
    const appList = await getPingApps(envID, ping_access_token)
    let promiseList = []
    let subList = []
    
    appList.forEach(app => {
        promiseList.push(getUsers(envID, ping_access_token, app[3]))
    });

    try {
        await Promise.all(promiseList).then(data =>{
            for(let i=0; i<data.length; i++){
                subList.push({
                id   : appList[i][0],
                status  : appList[i][2],
                name : appList[i][1],
                emps: data[i]
                })
            }
        })
        return subList   
    } catch (error) {
        console.log(error)
    }
}

module.exports={getPingApps,getSubData}