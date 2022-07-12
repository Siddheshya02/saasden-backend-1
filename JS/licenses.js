const axios = require('axios')
const subSchema = require('../models/subs')

async function getData(xero_access_token, xero_tenant_ID){
    //Using cached Okta Data
    let appList = []
    let promises = []
    const apps = await subSchema.find()
    apps.forEach(app => {
        promises.push(
            axios.get(`https://api.xero.com/api.xro/2.0/Invoices?ContactIDs=${app.contactID}`, {
            headers:{
                'Authorization': 'Bearer ' + xero_access_token,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'xero-tenant-id': xero_tenant_ID
            }
            }).then((output)=>{
                let invoice = output.data.Invoices.pop()
                appList.push({
                    appID             : app.appID,
                    status            : app.status,
                    appName           : app.appName,
                    users             : app.assignedUsers, //JSON -> {userID, name}
                    licences_used     : app.assignedUsers.length,
                    licences_purchased: invoice.LineItems[0].Quantity,             
                    total_amount      : invoice.Total,
                    renewalDate       : invoice.DueDate
                })
            }).catch(error=>{
                console.log(error)
            })
        )
    })
    Promise.all(promises).then(()=>{
        console.log(appList)
        return appList
    }).catch(error => console.log(error))
    
}

module.exports = {getData}