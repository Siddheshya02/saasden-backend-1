const axios = require('axios')
// const options = {
//     'method': 'GET',
//     'url': 'https://api.pingone.asia/v1/environments/bee61eaa-f4f3-4f30-ade2-eb35a36e7309/applications',
//     'headers': {
//        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImRlZmF1bHQifQ.eyJjbGllbnRfaWQiOiI1MjRkMzIzMy1mYzJiLTQ1YTgtYjFjMC0wNGI4YWY2ODkzMjMiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5hc2lhL2JlZTYxZWFhLWY0ZjMtNGYzMC1hZGUyLWViMzVhMzZlNzMwOS9hcyIsImlhdCI6MTY1ODU1MDQyNCwiZXhwIjoxNjU4NTU0MDI0LCJhdWQiOlsiaHR0cHM6Ly9hcGkucGluZ29uZS5hc2lhIl0sImVudiI6ImJlZTYxZWFhLWY0ZjMtNGYzMC1hZGUyLWViMzVhMzZlNzMwOSIsIm9yZyI6ImMwMThjMTcwLWQ3MDktNDlhYS05YTdjLTIxNzhjYzNkY2NlMiJ9.GDgYH0hl9qEF1qeavbHwj2Il-To37EUV6DfsLSKB3hs11A6YYboEryBtltq8MOMBlXPuZ2_WQG1eeKunBnJOEKUghdY_erk3u17dk3Cob8pz38oeeYUY5o-uvo9yMe_GKUgTl0gTiZjvwpZb412oJ5CFHxls0YB4xFqOrZzuSxGSg7EO6oGKrqyy-T6t_bcj7E9Pp76Ysv_EhuGSjHeXV_9QivbHW9MlGEI4f6-RAI9fjgl45Vql0VTLAfQ1ZzKEF7LESHuLieawo7paRvpMU6tvgu0XIPhhBlRavkGTl-T7_Eit_pK0JCKrnLc56ZzDfmeQ3kAsnhZ84f5raP4WbQ'
//     }
// };
// axios.request(options).then((res) => {
//     res.data._embedded.applications.forEach(app => {
//         console.log(app.id + ' - ' + app.name)
//         console.log(app._links)
//     });
// }).catch(err => {
//     console.log(err)
// })

async function getApps(envID, ping_access_token){
    const options = {
        'method': 'GET',
        'url': `https://api.pingone.asia/v1/environments/${envID}/applications`,
        'headers': {
           'Authorization': 'Bearer ' + ping_access_token
        }
    };

    let appList = []

    try {
        let res = await axios.request(options)
        res.data._embedded.applications.forEach(app => {
            if(app.accessControl && app.accessControl.group)
                appList.push([app.id, app.name, app.accessControl.group.groups])
        });
        return appList
    } catch (error) {
        console.log(error)
    }
}

async function getUsers(envID, ping_access_token){
    let appList = await getApps(envID, ping_access_token)
    var options = {
        'method': 'GET',
        'url': 'https://api.pingone.asia/v1/environments/bee61eaa-f4f3-4f30-ade2-eb35a36e7309/users',
        'headers': {
            'Authorization': 'Bearer ' + ping_access_token
        }
        };
        try {
            let res = await axios.request(options)
            return res.data._embedded.users._links
        } catch (error) {
            console.log(error)
        }
}


async function getUsers(ping_access_token){
    var options = {
    'method': 'GET',
    'url': 'https://api.pingone.asia/v1/environments/bee61eaa-f4f3-4f30-ade2-eb35a36e7309/users',
    'headers': {
        'Authorization': 'Bearer ' + ping_access_token
    }
    };
    try {
        let res = await axios.request(options)
        return res.data._embedded.users._links
    } catch (error) {
        console.log(error)
    }
}

// getApps(ping_access_token).then(data =>{
//     console.log(data)
// })

// getUsers(ping_access_token).then(data => {
//     console.log(data)
// })


var env = 'bee61eaa-f4f3-4f30-ade2-eb35a36e7309'
var ping_access_token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImRlZmF1bHQifQ.eyJjbGllbnRfaWQiOiI1MjRkMzIzMy1mYzJiLTQ1YTgtYjFjMC0wNGI4YWY2ODkzMjMiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5hc2lhL2JlZTYxZWFhLWY0ZjMtNGYzMC1hZGUyLWViMzVhMzZlNzMwOS9hcyIsImlhdCI6MTY1ODc1MDMzNywiZXhwIjoxNjU4NzUzOTM3LCJhdWQiOlsiaHR0cHM6Ly9hcGkucGluZ29uZS5hc2lhIl0sImVudiI6ImJlZTYxZWFhLWY0ZjMtNGYzMC1hZGUyLWViMzVhMzZlNzMwOSIsIm9yZyI6ImMwMThjMTcwLWQ3MDktNDlhYS05YTdjLTIxNzhjYzNkY2NlMiJ9.W943rE58KNcrS5VdxSiw8LAFZS-p0spKg8VaIUfgNfXVpGXlyFSmsWF3tVu8eqwRnJkc7ewenAxqW5IfadAPbfNO-6k6WUXmjlMdtbCnwvw5hb1fgFlxWOMnv7nBp6vFE1wfQE6VMISfacvF6FvdfjreRoQPa11O0asOH-Jc3UITnpvwGdx7P5jjM7hp4tRJSHP6L_THwJCbqJHEkoKabsVwnHgU9IqXcBY8_eYpjXncRBNhuYAs6K5nZELkNqdmxxZR0bibp7Ht9_qRYNAETNb8wbWUuv8Uc16XBxlK4px1K-AvYVhcffOHRn0Hd2osVzoesZz8CYr7ZeyK9h0PYg'

getApps(env, ping_access_token).then(res => {
    console.log(res)
})