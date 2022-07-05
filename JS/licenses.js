const axios = require('axios')
const options = require('./utils')

async function getActiveLicences(appID, oktaDomain, oktaAPIKey){
    const options_Okta_1 = options.getOktaOptions(oktaDomain, '/api/v1/apps/' + appID, 'GET', oktaAPIKey)
    const options_Okta_2 = options.getOktaOptions(oktaDomain, '/api/v1/apps/' + appID +'/users', 'GET', oktaAPIKey)
    const output_1 = await axios.request(options_Okta_1) //make this parallel
    const output_2 = await axios.request(options_Okta_2)
    let users = []
    output_2.data.forEach(user => {
        users.push({
            userID : user.id,
            name: user.profile.name
        })
    })
    
    return {
        status: output_1.data.status,
        activeLicences: users.length,
        users:  users
    }
}

async function totalAmount(contactID, accessToken, tenantID){
    const options_Xero=options.getXeroOptions(`https://api.xero.com/api.xro/2.0/Invoices?ContactIDs=${contactID}`,'GET',tenantID, accessToken)
    const output=await axios.request(options_Xero)
    const data = output.data.Invoices.pop()
    return {
        renewalDate: data.DueDate,
        txAmount : data.Total,
        quantity : data.LineItems[0].Quantity
    }
}


module.exports = {getActiveLicences, totalAmount}
//Base request url : https://api.xero.com/api.xro/2.0/Invoices?parameters