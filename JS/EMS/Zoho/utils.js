import axios from 'axios'

export async function verifyToken (accessToken, tenantID) {
  try {
    const res = await axios.get('https://expense.zoho.in/api/v1/contacts', {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'X-com-zoho-expense-organizationid': tenantID
      }
    })
    if (res.status === 401) { return false }
    return true
  } catch (error) {
    console.log(error)
  }
}

export async function getNewToken (refreshToken, clientID, clientSecret) {
  const url = new URL('https://accounts.zoho.in/oauth/v2/token')
  url.searchParams.append('refresh_token', refreshToken)
  url.searchParams.append('client_id', clientID)
  url.searchParams.append('client_secret', clientSecret)
  url.searchParams.append('redirect_uri', `${process.env.redirect_URI}`)
  url.searchParams.append('grant_type', 'refres_token')
  try {
    const tokenSet = await axios.post(url.toString(), {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      }
    })
    return tokenSet.data.access_token
  } catch (error) {
    console.log(error)
  }
}

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
  try {
    const response = await axios.get('https://expense.zoho.in/api/v1/expensereports', {
      headers: {
        'X-com-zoho-expense-organizationid': orgId,
        Authorization: `Zoho-oauthtoken ${accessToken}`
      }
    })
    const reports = response.data.expense_reports
    return reports
  } catch (error) {
    console.log(error)
  }
}

async function getExpenseReport (uri, options) {
  try {
    const expenses = await axios.request(uri, options)
    return expenses.data
  } catch (error) {
    console.log(error)
  }
}

async function getExpense (reports, name, orgId, accessToken) {
  let id
  for (const report of reports) {
    if (report.report_name.toLowerCase().includes(name.toLowerCase())) {
      id = report.report_id
      break
    }
  }
  if (!id) {
    return null
  }
  const uri = `https://expense.zoho.in/api/v1/expensereports/${id}`
  let results = {}
  let licences = 0; let currentCost = 0; const report_id = id

  const options = getZohoOptions(orgId, accessToken, 'GET', uri)
  try {
    const data = await getExpenseReport(uri, options)
    const e = data.expense_report.expenses
    licences += e.length
    currentCost += e[0].total
    const dueDate = data.expense_report.due_date

    results = { report_id: report_id, licences: licences, currentCost: currentCost, PerSubscription: currentCost / licences, dueDate: dueDate }
    return results
  } catch (error) {
    console.log(error)
  }
}

// updated this function as  orgId is passed as arguement to the function
export async function getZohoData (orgId, accessToken, subData) {
  try {
    const allExpenses = await getAllExpenseReports(orgId, accessToken)
    const subList = subData.subList
    for (const sub of subList) {
      const expense = await getExpense(allExpenses, sub.name, orgId, accessToken)
      if (!expense) { continue }
      sub.emsID = expense.report_id
      sub.licences = expense.licences
      sub.currentCost = expense.currentCost
      const PerSubscription = expense.PerSubscription
      sub.amountSaved = sub.currentCost - sub.emps.length * PerSubscription
      sub.dueDate = expense.dueDate
      subData.amtSaved += sub.amountSaved == null ? 0 : sub.amountSaved
      subData.amtSpent += sub.currentCost == null ? 0 : sub.currentCost
    }
    console.log('Zoho data saved successfully')
    return subData
  } catch (error) {
    console.log(error)
  }
}
