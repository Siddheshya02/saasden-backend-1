const axios = require('axios')
const subSchema = require('../models/subs')

async function getData(xero_access_token, xero_tenant_ID){
    //Using cached Okta Data
    let xeroLinks = []
    let appList = []
    const apps = await subSchema.find()
    apps.forEach(app => {
        appList.push({
            appID             : app.appID,
            status            : app.status,
            appName           : app.appName,
            users             : app.assignedUsers, //JSON -> {userID, name}
            licences_used     : app.assignedUsers.length,
            licences_purchased: '',             
            total_amount      : '',
            renewalDate       : ''
        })
        xeroLinks.push(`https://api.xero.com/api.xro/2.0/Invoices?ContactIDs=${app.contactID}`)
    })
    Promise.all(xeroLinks.map((xeroLink) => axios.get(xeroLink,{
        'Authorization': 'Bearer ' + xero_access_token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'xero-tenant-id': xero_tenant_ID
    }))).then((data)=>{
        for(let i=0; i<data.length; i++){
            appList[i].licences_purchased = promise[i].licences_purchased
            appList[i].total_amount = promise[i].total_amount
            appList[i].renewalDate = promise[i].renewalDate
        }
        return appList
    }).catch(error=>{
        console.log(error)
    })
}

module.exports = {getData}