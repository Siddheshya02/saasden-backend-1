module.exports.getHeaders = (domain, path, api_token) => {
    const options = {
        url: domain + path,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': api_token
        }

    }
    return options
}