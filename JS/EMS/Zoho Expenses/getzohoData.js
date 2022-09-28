const axios = require('axios')
const getZohoOptions = require('./utils')
async function getExpenseReport (uri, options) {
  const expenses = await axios.request(uri, options)
  return expenses.data
}

async function getExpense (reports, name, orgIds, accessToken) {
  let id
  for (const report of reports) {
    if (report.report_name.toLowerCase().includes(name.toLowerCase())) {
      id = report.report_id
      break
    }
  }
  const uri = `https://expense.zoho.in/api/v1/expensereports/${id}`
  let results = {}
  let liscenses = 0; let currentCost = 0; const report_id = id; let dueDate
  for (const org of orgIds) {
    const options = getZohoOptions(org, accessToken, 'GET', uri)
    const data = await getExpenseReport(uri, options)
    const e = data.expense_report.expenses[0]
    liscenses += e.line_items.length
    currentCost += e.total
    dueDate = data.expense_report.due_date
  }
  results = { report_id: report_id, liscenses: liscenses, currentCost: currentCost, PerSubscription: currentCost / liscenses, dueDate: dueDate }
  return results
}
async function getZohoOrgIds (accessToken) {
  const orgIds = []
  const options = {
    method: 'GET',
    headers: {
      Authorization: 'Zoho-oauthtoken ' + accessToken
    }
  }
  const orgs = await axios.request('https://expense.zoho.in/api/v1/organizations', options)
  for (let i = 0; i < orgs.data.organizations.length; i++) {
    orgIds.push(orgs.data.organizations[i].organization_id)
  }
  return orgIds
}
async function getAllExpenseReports (orgIds, accessToken) {
  let reports
  for (let i = 0; i < orgIds.length; i++) {
    const options = {
      method: 'GET',
      headers: {
        'X-com-zoho-expense-organizationid': orgIds[i],
        Authorization: 'Zoho-oauthtoken ' + accessToken
      }
    }
    const response = await axios.request('https://expense.zoho.in/api/v1/expensereports', options)
    reports = response.data.expense_reports
  }
  return reports
}
async function getZohoData (accessToken, subList) {
  const orgIds = await getZohoOrgIds(accessToken)
  const allExpenses = await getAllExpenseReports(orgIds, accessToken)
  for (const sub of subList) {
    const expense = await getExpense(allExpenses, sub.name, orgIds, accessToken)
    sub.emsID = expense.report_id
    sub.licences = expense.liscenses
    sub.currentCost = expense.currentCost
    const PerSubscription = expense.PerSubscription
    sub.amountSaved = sub.currentCost - sub.emps.length * PerSubscription
    sub.dueDate = expense.dueDate
  }
  return subList
}
module.exports = { getExpenseReport, getExpense, getAllExpenseReports, getZohoData }
