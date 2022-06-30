function getOktaOptions(path, method){
    const domain = process.env.OKTA_DOMAIN 
    const api_token = process.env.OKTA_API_TOKEN
    const options = {
        method: method,
        url: domain + path,
        headers:{
            Authorization: api_token,
            Accept: 'application/json',
            ContentType: 'application/json',
        }
    }
    return options
}


function getXeroOptions(url, method, tenantID, bearer){
    const options = {
        method: method,
        url: url,
        headers:{
            'Authorization': 'Bearer ' + bearer,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'xero-tenant-id': tenantID
        }
    }
    return options
}

module.exports = {getOktaOptions, getXeroOptions}