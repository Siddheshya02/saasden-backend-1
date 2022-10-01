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

async function getAllExpenseReports (orgId, accessToken) {
  const reports = []
  const response = await axios.get('https://expense.zoho.in/api/v1/expensereports', {
    headers: {
      'X-com-zoho-expense-organizationid': orgId,
      Authorization: `Zoho-oauthtoken ${accessToken}`
    }
  })
  reports.push(response.data.expense_reports)
  return reports
}

async function getExpenseReport (uri, options) {
  const expenses = await axios.request(uri, options)
  return expenses.data
}

async function getExpense (reports, name, orgId, accessToken) {
  let id
  for (const report of reports) {
    if (report.report_name.toLowerCase().includes(name.toLowerCase())) {
      id = report.report_id
      break
    }
  }
  const uri = `https://expense.zoho.in/api/v1/expensereports/${id}`
  let results = {}
  let liscenses = 0; let currentCost = 0; const report_id = id

  const options = getZohoOptions(orgId, accessToken, 'GET', uri)
  const data = await getExpenseReport(uri, options)
  const e = data.expense_report.expenses[0]
  liscenses += e.line_items.length
  currentCost += e.total
  const dueDate = data.expense_report.due_date

  results = { report_id: report_id, liscenses: liscenses, currentCost: currentCost, PerSubscription: currentCost / liscenses, dueDate: dueDate }
  return results
}
// updated this function as  orgId is passed as arguement to the function
export async function getZohoData (orgId, accessToken, subList) {
  const allExpenses = await getAllExpenseReports(orgId, accessToken)
  for (const sub of subList) {
    const expense = await getExpense(allExpenses, sub.name, orgId, accessToken)
    sub.emsID = expense.report_id
    sub.licences = expense.liscenses
    sub.currentCost = expense.currentCost
    const PerSubscription = expense.PerSubscription
    sub.amountSaved = sub.currentCost - sub.emps.length * PerSubscription
    sub.dueDate = expense.dueDate
  }
  return subList
}
