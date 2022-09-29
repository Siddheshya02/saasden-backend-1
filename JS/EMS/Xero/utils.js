const axios = require('axios')

async function getTxData (tenantID, accessToken, sub) {
  try {
    const res = await axios.get(`https://api.xero.com/api.xro/2.0/Invoices?ContactIDs=${sub.emsID}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'xero-tenant-id': tenantID
      }
    })
    const invoice = res.data.Invoices.pop()
    sub.licences = invoice.LineItems[0].Quantity
    sub.currentCost = invoice.Total
    sub.dueDate = invoice.DueDateString.substring(0, 10)
    sub.amountSaved = (sub.licences - sub.emps.length) * sub.currentCost / sub.licences
    return sub
  } catch (error) {
    console.log(error)
  }
}

export async function getXeroData (tenantID, accessToken, subList) {
  try {
    const res = await axios.get('https://api.xero.com/api.xro/2.0/contacts?summaryOnly=True', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'xero-tenant-id': tenantID
      }
    })
    for (let i = 0; i < subList.length; i++) {
      for (const emsApp of res.data.Contacts) {
        if (subList[i].name === emsApp.Name) {
          subList[i].emsID = emsApp.ContactID
          subList[i] = await getTxData(tenantID, accessToken, subList[i])
          break
        }
      }
    }
    console.log('Xero Data saved successfully')
    return subList
  } catch (error) {
    console.log(error)
  }
}
