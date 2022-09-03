const axios = require('axios')

function convertTimestamp(timestamp) {
    var d = new Date(timestamp), // Convert the passed timestamp to milliseconds
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),  // Months are zero based. Add leading 0.
        dd = ('0' + d.getDate()).slice(-2),         // Add leading 0.
        // hh = d.getHours(),
        // h = hh,
        // min = ('0' + d.getMinutes()).slice(-2),     // Add leading 0.
        // ampm = 'AM',
        // time;

    // if (hh > 12) {
    //     h = hh - 12;
    //     ampm = 'PM';
    // } else if (hh === 12) {
    //     h = 12;
    //     ampm = 'PM';
    // } else if (hh == 0) {
    //     h = 12;
    // }

    time = dd + '-' + mm + '-' + yyyy
    return time
}

async function getContacts(tenantID, access_token, subList){
    const res = await axios.get('https://api.xero.com/api.xro/2.0/contacts?summaryOnly=True',{
        headers:{
            'Authorization': 'Bearer ' + access_token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'xero-tenant-id': tenantID
        }
    })
    
    for(app in subList){
        for(ems_app in res.data){
            if(app.name == ems_app.Name){
                app.emsID = ems_app.ContactID
            }
        }
    }

    return subList
}

async function getData(tenantID, access_token, sub){
    try{
        const res = await axios.get(`https://api.xero.com/api.xro/2.0/Invoices?ContactIDs=${sub.emsID}`, {
            headers:{
                'Authorization': 'Bearer ' + access_token,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'xero-tenant-id': tenantID
            }
        })
        let invoice = res.data.Invoices.pop()
        let dt = invoice.DueDate
        sub.licences = invoice.LineItems[0].Quantity
        sub.currentCost = invoice.Total
        sub.dueDate = convertTimestamp((dt).substring(7, dt.length()-8))
        sub.amountSaved = (sub.licences - sub.apps.length()) * sub.currentCost / sub.licences
        return sub
    }catch(error){
        console.log(error)
    }
}