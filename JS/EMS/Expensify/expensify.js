const axios = require("axios")
const options = {
    requestJobDescription: {
        "type":"file",
        "credentials":{
            "partnerUserID": "aa_nishit_saasden_club",
            "partnerUserSecret": "6b7dfd5732290967edd3bbc8f872bf17017681b2"
        },
        "onReceive":{
            "immediateResponse": ["returnRandomFileName"]
        },
        "inputSettings":{
            "type": "combinedReportData",
            "reportState": "APPROVED",
            "limit": "10",
            "filters":{
                "startDate":"2022-06-20",
                "endDate":"2022-07-30",
                "markedAsExported":"Expensify Export"
            }
        },
        "outputSettings":{
            "fileExtension":"json",
            "fileBasename":"myExport"
        },
    }
}

axios.post('https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations', )
.then(res => {
    console.log(res)
}).catch(error=>{
    console.log(error)
})