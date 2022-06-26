module.exports.getHeaders = (domain, path, method, api_token) => {
    const options = {
        url: domain + path,
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': api_token
        }

    }
    return options
}