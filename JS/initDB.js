const subsSchema = require("../models/subs")
const mapping = require("./mapping")
const axios = require('axios')

function cacheSubscriptions(oktaDomain, oktaAPIKey, xero_Access_Token, xero_tenant_ID){
    let okta_apps = []
    let userListLinks = []
    
    mapping.map_xero_to_okta(oktaDomain, oktaAPIKey, xero_Access_Token, xero_tenant_ID) // get apps both in xero and okta
    .then((contactList)=>{
        //prepare subsSchema doc
        contactList.forEach(app => {
            userListLinks.push(app.usersList)
            okta_apps.push({
                appID: app.appID,
                contactID: app.contactID,
                appName: app.appName,
                status: app.status,
                assignedUsers: []
            })
        })

        //Call okta api to get list of all users in the mapped apps
        Promise.all(userListLinks.map((userList)=> axios.get(userList, {headers: {Authorization: oktaAPIKey, "Content-Type": 'application/json'}})))
        .then((res)=>{
            let index = 0
            res.forEach(userList => {
                userList.data.forEach(user => {
                    okta_apps[index].assignedUsers.push({
                        userID: user.id,
                        name: user.profile.name
                    })
                })
                ++index
            })

            //cache them to DB
            subsSchema.insertMany(okta_apps, {ordered: false})
            .then(() => console.log("Database updated successfully"))
            .catch(error => console.log(error))
        }).catch((error)=>{
            console.log(error)
        })
    })
    .catch(error => {
        console.log(error)
    })
}

module.exports = {cacheSubscriptions}