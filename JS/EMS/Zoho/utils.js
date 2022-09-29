import axios from 'axios'

function getZohoOptions (orgId, accessToken, method, uri) {
  const zohoOptions = {
    headers: {
      'X-com-zoho-expense-organizationid': orgId,
      Authorization: 'Zoho-oauthtoken ' + accessToken
    }
  }
  return zohoOptions
}

async function getZohoOrgIds (accessToken) {
  const orgs = await axios.get('https://expense.zoho.in/api/v1/organizations', {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`
    }
  })

  const orgIds = []
  for (const organization in orgs.data.organization) {
    orgIds.push(organization.organization_id)
  }

  return orgIds
}

async function getAllExpenseReports (orgIds, accessToken) {
  const reports = []
  for (let i = 0; i < orgIds.length; i++) {
    const response = await axios.get('https://expense.zoho.in/api/v1/expensereports', {
      headers: {
        'X-com-zoho-expense-organizationid': orgIds[i],
        Authorization: `Zoho-oauthtoken ${accessToken}`
      }
    })
    reports.push(response.data.expense_reports)
  }

  return reports
}

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

export async function getZohoData (accessToken, subList) {
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
