const axios=require('axios')

async function getToken(subdomain, client_id, client_secret){  
  const res = await axios.post(`https://${subdomain}.onelogin.com/auth/oauth2/v2/token`, {
    client_id: client_id,
    client_secret: client_secret,
    grant_type : "client_credentials"
  },{
    "Content-Type": "application/x-www-form-urlencoded" 
  })
  return res.data
}

// const url = "https://saasdenbits-dev.onelogin.com/auth/oauth2/v2/token"
// const clientID = '45bba86eec3e9d1b3643175ce317ead17596f66e30fdd7a0f8a2c9fbf9411690'
// const clientSecret = '754a02f204451ed03e2b996803cc4e4a19366a7f41db3eedb8fa8e31bb338e2c'
// getToken(url, clientID, clientSecret)

async function getSubList(subdomain, accessToken){
    const res = await axios.post(`https://${subdomain}/api/2/apps`,{},{
        Authorization: `Bearer ${accessToken}`
    })
    return res.data
}

module.exports = {getToken, getSubList}