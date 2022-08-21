const axios=require('axios')

function getZohoOptions(orgId,accessToken,method,uri){
    const zohoOptions={
        method:method,
        uri:uri,
        headers:{
            "X-com-zoho-expense-organizationid":orgId,
            "Authorization": "Zoho-oauthtoken "+accessToken

        }
    }
    return zohoOptions
}

async function getZohoAccessTokens(method,uri){
    const zohoCallBackOptions={
        method:method,
        uri:uri,
        headers:{
            "Content-type":"application/x-www-form-urlencoded"
        }
    }
    const response=await axios.request(uri,zohoCallBackOptions)
    let accessToken=response.data.access_token
    return accessToken
}

async function getZohoOrgIds(accessToken,orgIds){
    const options={
     method:"GET",
     headers:{
            "Authorization":"Zoho-oauthtoken " + accessToken
     }
    }
    const orgs=await axios.request('https://expense.zoho.in/api/v1/organizations',options)
    for(let i=0;i<orgs.data.organizations.length;i++){
       orgIds.push(orgs.data.organizations[i].organization_id)
    }
}

module.exports={getZohoOptions,getZohoAccessTokens,getZohoOrgIds}