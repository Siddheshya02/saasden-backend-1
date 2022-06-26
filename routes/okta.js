const express = require('express')
const router = express.Router()
const request = require('request')
const httpsHeader = require("../JS/getHeaders")

const domain = "https://trial-2640796.okta.com"
const api_token = "SSWS 005UYgB9e0MdLcB3ystcwleeVi2j1bixFXRjMYztZ0"
const clientID = "0oa1eghxx2scZAdnA697"

//get list of all applications
router.get("/app/list", async(req,res) => {
    const options = httpsHeader.getHeaders(domain, '/api/v1/apps', 'GET', api_token)
    request(options, function(err, result, body) {
        if(err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            output = JSON.parse(body)
            let x = []
            output.forEach(element => {
                x.push({
                    id : element.id,
                    name : element.label,
                    status: element.status
                })
            });
            res.send(JSON.stringify({data : x}))
        }
    });

});


//get list of groups
router.get("/groups/list", async(req,res) => {
    const options = httpsHeader.getHeaders(domain, '/api/v1/groups', 'GET', api_token)
    request(options, function(err, result, body) {
        if(err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            output = JSON.parse(body)
            let x = []
            output.forEach(element => {
                x.push({id : element.id})
            });
            res.send(JSON.stringify({data : x}))
        }
    });

});

//deactivate an application
router.get("/app/deactivate", async(req,res) => {
    const appID = req.query.ID
    const path = '/api/v1/apps/'+ appID +'/lifecycle/deactivate'
    const options = httpsHeader.getHeaders(domain, path, 'POST', api_token)
    request(options, function(err, result, body) {
        if(err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            res.sendStatus(200)
        }
    });

});

//delete an application
router.get("/app/delete", async(req,res) => {
    const appID = req.body.ID
    const path = '/api/v1/apps/' + appID
    const options = httpsHeader.getHeaders(domain, path, 'DELETE', api_token)
    request(options, function(err, result, body) {
        if(err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            res.sendStatus(200)
        }
    });

});

//remove a user from an application
router.get("/app/user/remove", async(req,res) => {
    const appID = req.query.appID
    const usrID = req.query.usrID
    const path =  '/api/v1/apps/'+ appID +'/users/' + usrID
    const options = httpsHeader.getHeaders(domain, path, 'POST', api_token)

    request(options, function(err, result, body) {
        if(err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            res.sendStatus(200)
        }
    });

});

//list all users assigned under an app
router.post("/app/user/list", async(req,res) => {
    const appID = req.body.appID
    const path = '/api/v1/apps/' + appID + '/users/'
    const options = httpsHeader.getHeaders(domain, path, 'GET', api_token)

    request(options, function(err, result, body) {
        if(err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            output = JSON.parse(body)
            x = []
            output.forEach(element => {
                x.push({    
                    id : element.id,
                    userName : element.credentials.userName
                })
            })
            res.send({data : x})
        }
    });

});

module.exports = router;