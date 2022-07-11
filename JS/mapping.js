const options = require("./utils")
const axios = require('axios')

async function map_xero_to_okta(oktaDomain, oktaAPIKey, accessToken, tenantID){   
    //fetch okta app details
    var okta_apps = []
    const options_Okta = options.getOktaOptions(oktaDomain, '/api/v1/apps', 'GET', oktaAPIKey)
    var output = await axios.request(options_Okta)
    output.data.forEach(app => okta_apps.push([app.id, app.label, app.status, app._links.users.href]));

    //fetch xero contact list
    var xeroList = []
    const options_Xero = options.getXeroOptions('https://api.xero.com/api.xro/2.0/Contacts', 'GET', tenantID, accessToken)
    var output = await axios.request(options_Xero)    
    output.data.Contacts.forEach(contact => xeroList.push([contact.ContactID, contact.Name]))
    
    //loop to map okta apps to xero apps
    var contactList = []
    okta_apps.forEach(app => {
        for(i=0; i<xeroList.length; i++){
            if(app[1] == xeroList[i][1]){
                contactList.push({
                    appID: app[0],
                    contactID: xeroList[i][0],
                    appName: app[1],
                    status: app[2], 
                    usersList: app[3]
                })
                xeroList.splice(i,1)
                break
            }
        }
    })
    return contactList
}

module.exports = {map_xero_to_okta}