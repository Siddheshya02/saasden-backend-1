const axios=require('axios')
const getZohoOptions=require('./utils')
async function getExpenseReport(uri,options){
    const expenses=await axios.request(uri,options)
    return expenses.data
}
async function getExpense(reports,name,orgIds,accessToken)
{
    let id
     for (const report of reports) {
         if(report.report_name.toLowerCase().includes(name.toLowerCase()))
         {
            id=report.report_id
            break
         }
       }
       const uri=`https://expense.zoho.in/api/v1/expensereports/${id}`
       let results=[]
      for(let org of orgIds)
      {
        const options=getZohoOptions(org,accessToken,"GET",uri)
        const data=await getExpenseReport(uri,options)
        let e=data.expense_report.expenses[0]
        results.push({subscriptions:e.line_items.length,total:e.total,PerSubscription:e.total/e.line_items.length})
      }
      return results
}
async function getAllExpenseReports(orgIds,accessToken)
{
    let reports
    for(let i=0;i<orgIds.length;i++)
    {
       const options={
           method:"GET",
           headers:{
               "X-com-zoho-expense-organizationid":orgIds[i],
               "Authorization": "Zoho-oauthtoken "+accessToken

           }
       }
       const response=await axios.request('https://expense.zoho.in/api/v1/expensereports',options)
       reports=response.data.expense_reports
    }
    return reports
}
module.exports={getExpenseReport,getExpense,getAllExpenseReports}