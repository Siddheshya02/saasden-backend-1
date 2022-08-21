const axios=require('axios')

async function getApps(apiToken){
    let options={
        method:'GET',
        uri:'https://console.jumpcloud.com/api/applications',
        headers:{
            'Accept': 'application/json',
            'Content-Type':'application/json',
            'x-api-key':`${apiToken}`
        }
    }
    
    const response=await axios.request('https://console.jumpcloud.com/api/applications',options)
    const apps=response.data.results
    
    return apps
}

async function getUsers(appID, apiToken){
    let options={
        method:'GET',
        uri:`https://console.jumpcloud.com/api/v2/applications/${appID}/users`,
        headers:{
            'content-type': 'application/json',
            'x-api-key': `${apiToken}`  
        }
    }
    const res1 = await axios.request(`https://console.jumpcloud.com/api/v2/applications/${appID}/users`,options)
    const usernames=[]
    
    res1.data.foreach(user => {
        options={
            method:'GET',
            uri:`https://console.jumpcloud.com/api/systemusers/${user.id}`,
            headers:{
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-key': `${apiToken}`  
            }
        }
        const res2 = await axios.request(options)
        usernames.push(res2.data)
    })
    return usernames
}

module.exports = {getApps, getUsers}