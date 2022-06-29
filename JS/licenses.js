async function getLicences(appID){
    const axios = require('axios')
    const oktaOptions = require("./getOktaOptions")
    const options = oktaOptions.getOptions('/api/v1/apps/' + appID, 'GET')
    const output = await axios.request(options)
    return output.data.length
}


async function totalAmount(contactID){
    //xero function to get all costs + quantity
}

