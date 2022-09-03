const axios=require('axios')
const subSchema = require("../../../models/subscription")
const empSchema = require("../../../models/employee")

async function getToken(subdomain, client_id, client_secret){  
	const res = await axios.post(`https://${subdomain}/auth/oauth2/v2/token`, {
		client_id: client_id,
		client_secret: client_secret,
		grant_type : "client_credentials"
	},{
		"Content-Type": "application/x-www-form-urlencoded" 
	})
	return res.data
}

async function getoneLoginApps(subdomain, accessToken){
	let OneLoginoptions={
		method: "GET",
		uri: `https://${subdomain}/api/2/apps`,
		headers:{
		'Authorization':`Bearer ${accessToken}`,   
		 }
	}
	const response=await axios.request(`https://${subdomain}/api/2/apps`,OneLoginoptions)
		   const apps=response.data
	apps.forEach(element => {
			element.name=element.name.toLowerCase()
		}); 
return apps   
}

async function getOneLoginUsers(subdomain, accessToken){
	let OneLoginoptions={
        method: "GET",
        uri: `https://${subdomain}/api/2/users`,
        headers:{
        'Authorization':`Bearer ${accessToken}`,   
         }
    }
    const response=await axios.request(`https://${subdomain}/api/2/users`,OneLoginoptions)
    const emps=response.data
    return emps
}

async function getOneLoginUserApps(userID, subdomain, accessToken){
	const res=await axios.get(`https://${subdomain}/api/2/users/${userID}/apps`, {
		headers:{
			'Authorization' : `Bearer ${accessToken}`
		}  
	})
  	return res.data
}

async function getSubs(subdomain, accessToken, user_saasden_id){
	const appList=await getoneLoginApps(subdomain, accessToken)
	const subList=[]
	for (const app of appList) {
		let options={
			method: 'GET',
			uri: `https://${subdomain}/api/2/apps/${app.id}/users`,
			headers:{
			'Authorization':`Bearer ${accessToken}`,   
			 }
		}
		const res=await axios.request(`https://${subdomain}/api/2/apps/${app.id}/users`,options)
        const emps=[]
		for (const user of res.data) {
			const {id,firstname,lastname,email,username}=user
			emps.push({
				id:id,
				firstname:firstname,
				lastname:lastname,
				username:username,
				email:email
			})
		}
		subList.push({
			id:app.id,
			name:app.name,
			emps:emps
		})
	}
	return subList
}

async function getEmps(subdomain, accessToken,  user_saasden_id){
	const empList=await getOneLoginUsers(subdomain,accessToken)
	const emps=[]
	for (const emp of empList) {
		const appList=await getOneLoginUserApps(emp.id,subdomain,accessToken)
		const userAppList=[]
		for (const app of appList) {
			userAppList.push({
				name:app.name.toLowerCase(),
                id:app.id
			})
		}
		emps.push({
			id: emp.id,
			email: emp.email,
			firstname: emp.firstname,
			userName: emp.username,
			lastname: emp.lastname,
			apps: userAppList
		})
	}
	return emps	
}
let accessToken
async function testing()
{
 	accessToken=await getToken('saasdenbits-dev.onelogin.com','45bba86eec3e9d1b3643175ce317ead17596f66e30fdd7a0f8a2c9fbf9411690','754a02f204451ed03e2b996803cc4e4a19366a7f41db3eedb8fa8e31bb338e2c')
	getSubs('saasdenbits-dev.onelogin.com',accessToken.access_token)
}
testing()
module.exports={getToken, getSubs, getEmps}

// const url = "https://saasdenbits-dev.onelogin.com/auth/oauth2/v2/token"
// const clientID = '45bba86eec3e9d1b3643175ce317ead17596f66e30fdd7a0f8a2c9fbf9411690'
// const clientSecret = '754a02f204451ed03e2b996803cc4e4a19366a7f41db3eedb8fa8e31bb338e2c'
// getToken(url, clientID, clientSecret)
