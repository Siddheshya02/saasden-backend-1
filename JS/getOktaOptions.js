module.exports.getOptions = (path, method) => {
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