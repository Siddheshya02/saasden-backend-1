const express = require('express')
const router = express.Router()
const request = require('request')


const domain = "https://trial-2640796.okta.com"
const api_token = "SSWS 005UYgB9e0MdLcB3ystcwleeVi2j1bixFXRjMYztZ0"
const clientID = "0oa1eghxx2scZAdnA697"

router.get("/user/app/list", async(req,res) => {
    const options = {
        url: domain + '/api/v1/apps',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': api_token
        }

    }

    request(options, function(err, result, body) {
        if(err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            output = JSON.parse(body)
            let x = []
            output.forEach(element => {
                x.push([element.label,element.status, element.id])
            });
            res.render("output", {data : x})
        }
    });

});


//get list of groups
router.get("/user/groups", async(req,res) => {
    const options = {
        url: domain + '/api/v1/groups',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': api_token
        }

    }

    request(options, function(err, result, body) {
        if(err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            output = JSON.parse(body)
            let x = []
            output.forEach(element => {
                x.push([element.id])
            });
            res.render("output", {data : x})
        }
    });

});

//deactivate an application
router.get("/user/app/deactivate", async(req,res) => {
    const appID = req.query.ID
    const options = {
        url: domain + '/api/v1/apps/'+ appID +'/lifecycle/deactivate',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': api_token
        }

    }

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
router.get("/user/app/delete", async(req,res) => {
    const appID = req.body.ID
    const options = {
        url: domain + '/api/v1/apps/'+appID,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': api_token
        }

    }

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
router.get("/user/app/remove", async(req,res) => {
    
    const appID = req.query.appID
    const usrID = req.query.usrID
    
    const options = {
        url: domain + '/api/v1/apps/'+ appID +'/users/' + usrID,
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': api_token
        }

    }

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
router.get("/user/list", async(req,res) => {
    const appID = req.query.appID
    const usrID = req.query.usrID
    const options = {
        url: domain + '/api/v1/apps/${applicationId}/users/${userId}',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': api_token
        }

    }

    request(options, function(err, result, body) {
        if(err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            output = JSON.parse(body)
            x = []
            output.forEach(element => {
                x.push([element.profile.firstName + element.profile.lastName, element.id])
            });
            res.render("output", {data : x})
        }
    });

});

module.exports = router;