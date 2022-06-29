module.exports.getOptions = (url, method, tenantID, bearer) => {
    const options = {
        method: method,
        url: url,
        headers:{
            Authorization: 'Bearer ' + bearer,
            Accept: 'application/json',
            ContentType: 'application/json',
            'xero-tenant-id': tenantID
        }
    }
    return options
}