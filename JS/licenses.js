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


async function totalAmount(contactID,tenantID,accessToken){
    const axios=require('axios')
    const xeroOptions = require("./getXeroOptions")
  const options_Xero=xeroOptions.getOptions(`https://api.xero.com/api.xro/2.0/Invoices?ContactIDs=${contactID}`,'GET',tenantID, accessToken)
  const body=await axios.request(options_Xero)
//   const transactions=JSON.parse(body)
    return transactions
}
module.exports.totalAmount=totalAmount
//Base request url : https://api.xero.com/api.xro/2.0/Invoices?parameters
