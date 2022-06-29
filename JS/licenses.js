async function getActiveLicences(appID){
    const axios = require('axios')
    const oktaOptions = require("./getOktaOptions")
    const options = oktaOptions.getOptions('/api/v1/apps/' + appID, 'GET')
    const output = await axios.request(options)
    var data = []
    output.data.forEach(user => {
        data.push({
            userID : user.id,
            name: user.profile.firstName + ' ' + user.profile.lastName
        })
    });
    return data
}

async function totalAmount(contactID){
    //xero function to get all costs + quantity
}


modules.export = {getLicences, totalAmount}