const axios = require("axios")

async function getApps(envID, ping_access_token){
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
                    app.enabled,
                    app.accessControl.group.groups
                ])
        });
        return appList
    } catch (error) {
        console.log(error)
    }
}

async function getUsers(envID, ping_access_token, groupIDs){
    let promiseList = []
    let userList = []
    groupIDs.forEach(groupID => {
        let options = {
            'method': 'GET',
            'url': `https://api.pingone.asia/v1/environments/${envID}/users?filter=memberOfGroups[id%20eq%20%22${groupID.id}%22]`,
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
                    userID: user.id,
                    name:   user.name.formatted,
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

async function getSubData(envID, ping_access_token){
    const appList = await getApps(envID, ping_access_token)
    let promiseList = []
    let subList = []
    
    appList.forEach(app => {
        promiseList.push(getUsers(envID, ping_access_token, app[3]))
    });

    try {
        await Promise.all(promiseList).then(data =>{
            for(let i=0; i<data.length; i++){
                subList.push({
                appID   : appList[i][0],
                status  : appList[i][2],
                appName : appList[i][1],
                users   : data[i]
                })
            }
        })  
        
        subList.forEach(sub =>{
            console.log(sub)
        })
        
    } catch (error) {
        console.log(error)
    }
}

function activateApp(envID, ping_access_token, appID){
    // const url =  `https://api.pingone.asia/v1/environments/${envID}/applications/${appID}`
    // const headers = {
    //     'Authorization': `Bearer ${ping_access_token}`
    // }
    // const data = {
    //     "name": "UPDATED_" + Date.now(),
    //     "enabled": false,
    //     "type": "WEB_APP",
    //     "protocol": "SAML",
    //     "assertionDuration": 60,
    //     "spEntityId": "test",
    //     "acsUrls": [
    //         "https://example.com"
    //     ],
    // }

    // axios.put(url, data, {headers}).then(res =>{
    //     console.log(res)
    // }).catch(error=>{
    //     console.log(error)
    // })
    
}

async function deactivateApp(){

}

async function deleteUser(){

}