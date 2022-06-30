async function appDB(accessToken, tenantID){
    require('dotenv').config({path : '../.env'})
    const oktaOptions = require("./getOktaOptions")
    const xeroOptions = require("./getXeroOptions")
    const userAppSchema = require('../models/userApps')
    const axios = require('axios')
    
    var okta_apps = []
    const options_Okta = oktaOptions.getOptions('/api/v1/apps', 'GET')
    var output = await axios.request(options_Okta)
    output.data.forEach(app => okta_apps.push(app.label));

    var xeroList = []
    const options_Xero = xeroOptions.getOptions('https://api.xero.com/api.xro/2.0/Contacts', 'GET', tenantID, accessToken)
    var output = await axios.request(options_Xero)    
    output.data.Contacts.forEach(contact => xeroList.push([contact.ContactID, contact.Name]))
    
    var contactList = []
    okta_apps.forEach(app => {
        for(i=0; i<xeroList.length; i++){
            if(app == xeroList[i][1]){
                contactList.push({
                    appName : xeroList[i][1],
                    contactID : xeroList[i][0]
                })
                xeroList.splice(i,1)
                break
            }
        }
    })


    try {
        await userAppSchema.insertMany(contactList)
        console.log("Records inserted succesfully")
    } catch (error) {
        console.log(error)
    }
}