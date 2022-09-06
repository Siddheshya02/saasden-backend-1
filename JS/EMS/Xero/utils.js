const axios = require('axios')

function convertTimestamp (timestamp) {
  const d = new Date(timestamp)
  const yyyy = d.getFullYear()
  const mm = ('0' + (d.getMonth() + 1)).slice(-2)
  const dd = ('0' + d.getDate()).slice(-2)
  const time = dd + '-' + mm + '-' + yyyy
  return time
}

async function getTxData (tenantID, accessToken, sub) {
  try {
    const res = await axios.get(`https://api.xero.com/api.xro/2.0/Invoices?ContactIDs=${sub.emsID}`, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'xero-tenant-id': tenantID
      }
    })
    const invoice = res.data.Invoices.pop()
    const dt = invoice.DueDate
    sub.licences = invoice.LineItems[0].Quantity
    sub.currentCost = invoice.Total
    sub.dueDate = convertTimestamp((dt).substring(7, dt.length() - 8))
    sub.amountSaved = (sub.licences - sub.apps.length()) * sub.currentCost / sub.licences
    return sub
  } catch (error) {
    console.log(error)
  }
}

async function getXeroData (tenantID, accessToken, subList) {
  try {
    const res = await axios.get('https://api.xero.com/api.xro/2.0/contacts?summaryOnly=True', {
      headers: {
        Authorization: 'Bearer ' + accessToken,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'xero-tenant-id': tenantID
      }
    })
    for (let i = 0; i < subList.length; i++) {
      for (const emsApp in res.data) {
        if (subList[i].name === emsApp.Name) {
          subList[i].emsID = emsApp.ContactID
          subList[i] = await getTxData(tenantID, accessToken, subList[i])
        }
      }
    }
  } catch (error) {
    console.log(error)
  }

  return subList
}

module.exports = { getXeroData }
