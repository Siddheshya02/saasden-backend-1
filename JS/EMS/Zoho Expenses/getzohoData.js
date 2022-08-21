const axios=require('axios')
async function getZohoExpenses(uri,options){
    const expenses=await axios.request(uri,options)
    return expenses.data
}

module.exports=getZohoExpenses