function getOktaOptions(oktaDomain, path, method, oktaAPIKey){
    const options = {
        method: method,
        url: oktaDomain + path,
        headers:{
            Authorization: oktaAPIKey,
            ContentType: 'application/json',
        }
    }
    return options
}


function getXeroOptions(url, method, tenantID, bearer){
    const options = {
        method: method,
        url: url,
        headers:{
            'Authorization': 'Bearer ' + bearer,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'xero-tenant-id': tenantID
        }
    }
    return options
}

function getExpensifyOptions(credentials,  ){
    const options = {
        method: method,
        url: url,
        headers:{
            'Accept': 'application/json',
            'Content-Type': 'application/json',

        },
        requestJobDescription:{
            "type":"file",
            credentials,
            "onReceive":{
                "immediateResponse":["returnRandomFileName"]
            },
            "inputSettings":{
                "type":"combinedReportData",
                "reportState":"APPROVED",
                "limit":"5",
                "filters":{
                    "startDate":"2016-01-01",
                    "endDate":"2016-02-01",
                    "markedAsExported":"Expensify Export"
                }
            },
            "outputSettings":{
                "fileExtension":"json",
            },
        }
    }
    return options
}

module.exports = {getOktaOptions, getXeroOptions}