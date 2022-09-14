const axios = require('axios')

async function getToken (tenantID, clientID, clientSecret) {
  try {
    const token = await axios.post(`https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientID,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    // containes expiry time as well
    return token.data.access_token
  } catch (error) {
    console.log(error)
  }
}

async function getSubs (accessToken) {

}

async function getEmps (accessToken) {

}

async function disableApp (accessTokenm, appID) {

}

async function removeUser (accessToken, appID, userID) {

}

async function addUser (accessToken, appID, userID) {

}

getToken('d33ada5f-cb55-4c3e-9d4f-e55d4b4b54b0', '63ed1c03-90b6-4ac6-a601-7b03fc3d2651', '6o-8Q~~a4z-POR1gVWJyUEIJ87M9i5iW--uLncpO')
