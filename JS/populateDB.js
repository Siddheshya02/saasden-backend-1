function appDB(){
    require('dotenv').config({ path: '../.env' })
    const domain = process.env.OKTA_DOMAIN 
    const api_token = process.env.OKTA_API_TOKEN
    const httpsHeader = require("./getHeaders")
    const request = require('request')
    const options = httpsHeader.getHeaders(domain, '/api/v1/apps', 'GET', api_token)
    request(options, function(err, result, body) {
        if(err)
            console.log(err)
        else {
            output = JSON.parse(body)
            okta_apps = []
            output.forEach(app => okta_apps.push(app.name));
            console.log(okta_apps)
        }
    })

    let contactList = []
    xero_details.forEach(contact => contactList.push([contact.ContactID, contact.Name])
    data = []

    okta_apps.forEach(app => {
        var Xapp = contactList.filter((app, i)=>{
            return contactList[i] == app
        })
    });

    for


}


appDB()