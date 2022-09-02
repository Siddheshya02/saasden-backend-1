const axios = require('axios')

async function getData(tenantID, access_token, subName){
    try{
        const res = await axios.get(`https://api.xero.com/api.xro/2.0/Invoices?where=Type=="${subName}" AND Status=="AUTHORISED"`, {
            headers:{
                'Authorization': 'Bearer ' + access_token,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'xero-tenant-id': tenantID
            }
        })
        let invoice = res.data.Invoices.pop()
        return {
            licences_purchased: invoice.LineItems[0].Quantity, //assuming it is the same type of license        
            total_amount      : invoice.Total,
            renewalDate       : invoice.DueDate
        }
    }catch(error){
        console.log(error)
    }
}


tenantID = ''
access_token = ''
subName = ''
getData(tenantID, access_token, subName).then(data =>{
    console.log(data)
}).catch(error => {
    console.log(error)
})