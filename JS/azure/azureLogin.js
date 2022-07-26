const axios = require('axios')

async function getAuthCode(clientID, tenantID, redirectURI){
    try {
        await axios.get(`
        https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/authorize?
        client_id=${clientID}
        &response_type=code
        &redirect_uri=${redirectURI}
        &response_mode=query
        &scope=offline_access%20user.read%20mail.read
        &state=9898237`)
        .then(res =>{
            return(res.data)
        })    
    } catch (error) {
        console.log(error)
    }    
}

module.exports = {getAuthCode};


getAuthCode()
