import axios from 'axios'
import base64 from 'nodejs-base64-converter'

export async function getNewToken (clientID, clientSecret, refreshToken) {
  const tokenSet = await axios.post('https://identity.xero.com/connect/token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  }, {
    headers: {
      authorization: 'Basic ' + base64(`${clientID} : ${clientSecret}`),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  return tokenSet.data.access_token
}

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
    if (invoice === undefined) { return }
    sub.licences = invoice.LineItems[0].Quantity
    sub.currentCost = invoice.Total
    sub.dueDate = invoice.DueDateString.substring(0, 10)
    sub.amountSaved = (sub.licences - sub.emps.length) * sub.currentCost / sub.licences
    return sub
  } catch (error) {
    console.log(error)
  }
}

export async function getXeroData (tenantID, accessToken, subData) {
  try {
    const subList = subData.subList
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
        if ((subList[i].name).toLowerCase() === (emsApp.Name).toLowerCase()) {
          subList[i].emsID = emsApp.ContactID
          subList[i] = await getTxData(tenantID, accessToken, subList[i])
          if (subList[i] !== undefined) {
            subData.amtSaved += subList[i].amountSaved === null ? 0 : subList[i].amountSaved
            subData.amtSpent += subList[i].currentCost === null ? 0 : subList[i].currentCost
          }
          break
        }
      }
    }
    console.log('Xero Data saved successfully')
    return subData
  } catch (error) {
    console.log(error)
  }
}
