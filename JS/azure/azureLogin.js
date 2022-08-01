const axios = require('axios')

async function getSubs(accessToken){
    try {
        const data = await axios.get("https://graph.microsoft.com/v1.0/users",{
            headers:{
                Authorization: `Bearer ${accessToken}`
            }
        })
        console.log(data.data)    
    } catch (error) {
        console.log(error)
    }
}

async function getEmps(accessToken){
    
}


module.exports = {getSubs, getEmps};


