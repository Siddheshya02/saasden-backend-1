const axios = require('axios')
const options = require('./utils')
const subSchema = require('../models/subs')

async function getData(xero_accessToken, xero_tenant_ID){
    //Using cached Okta Data
    let appList = []
    const apps = await subSchema.find()
    Promise.all(
        apps.forEach(async(app) => {
            const options_Xero = options.getXeroOptions(`https://api.xero.com/api.xro/2.0/Invoices?ContactIDs=${app.contactID}`, 'GET', xero_tenant_ID, xero_accessToken)
            const output= await axios.request(options_Xero)
            const data = output.data.Invoices.pop()
            appList.push({
                appID             : app.appID,
                status            : app.status,
                appName           : app.appName,
                users             : app.assignedUsers, //JSON -> {userID, name}
                licences_used     : app.assignedUsers.length,
                licences_purchased: data.LineItems[0].Quantity,               
                total_amount      : data.Total,
                renewalDate       : data.DueDate,
            })
        })
    ).then(()=>{
        console.log(appList)
        return appList
    }).catch(error =>{
        console.log(error)
    })
}

module.exports = {getData}