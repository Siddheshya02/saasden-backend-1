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

async function getXeroData (tenantID, accessToken, subList) {
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

module.exports = { getXeroData }

// const accessToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFDQUY4RTY2NzcyRDZEQzAyOEQ2NzI2RkQwMjYxNTgxNTcwRUZDMTkiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJISy1PWm5jdGJjQW8xbkp2MENZVmdWY09fQmsifQ.eyJuYmYiOjE2NjI1NDY0NDUsImV4cCI6MTY2MjU0ODI0NSwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS54ZXJvLmNvbSIsImF1ZCI6Imh0dHBzOi8vaWRlbnRpdHkueGVyby5jb20vcmVzb3VyY2VzIiwiY2xpZW50X2lkIjoiMDVGODFGODM5MUE2NDY4MEIwN0UxODY2QzYzRjE1MUIiLCJzdWIiOiIxZDZjMjc3MjllNjk1MmE2OTU1ZDE4YzA1MTMyNTk2YiIsImF1dGhfdGltZSI6MTY2MjU0NTgxMiwieGVyb191c2VyaWQiOiI2MzEwZTcwNS03YmQyLTRjMzUtYTUyNi0zMTQ4MWUxNWQ4ZmMiLCJnbG9iYWxfc2Vzc2lvbl9pZCI6ImI4MzRkMmQ2N2VlNDRjYzViYTViN2YxMWUwYjkwYzAzIiwianRpIjoiMWIxYzdhNThiZDYyNmRiMDFlYTE0ZGZlNjVmNzY0ZDEiLCJhdXRoZW50aWNhdGlvbl9ldmVudF9pZCI6IjEzNWZjMTMyLTVjNjctNDQ3OC05YWY2LWZiMTYyN2VjZTg0ZSIsInNjb3BlIjpbImVtYWlsIiwicHJvZmlsZSIsIm9wZW5pZCIsImFjY291bnRpbmcuc2V0dGluZ3MiLCJhY2NvdW50aW5nLnRyYW5zYWN0aW9ucyIsImFjY291bnRpbmcuY29udGFjdHMiLCJvZmZsaW5lX2FjY2VzcyJdLCJhbXIiOlsic3NvIl19.Ap3qf9N0Y1diDekygvE4qTBDAay-kgGjlI7YGfsm7WMu5IeD42Re7ruuO1ZvGsMcTiblweezClbxpc9M55NdMfSAGvUhk1NCwpXkcIGbsLJ9fMJ-Wmmq-DP5Rbe-VhAm_RfyVo1YHKDeT6xpBAQpzIeurbdolm-5YkcjHZ-JkYhOIC3qLEUpdvSS1SS9nPO8WVEgNHiN8vRV5U_d7QXu3ix10dykkhgR-SFZRVViivT8i5jnEPQnzlmnqUvBt9DvWcy4W2vIx6qBQODE8uJk2E79uTqUyLK1xf-qkFrfkg3vEIbDEc2XWwFZJAOzeEZ1gX56-MsE7q-gXZgpU3UL2g'
// const tenantID = '3d20c52f-486c-4c3b-9489-82918cbc16f2'
// getXeroData(tenantID, accessToken, 'fuck').then(() => {
//   console.log('Done')
// }).catch(error => {
//   console.log(error)
// })
