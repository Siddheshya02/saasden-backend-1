# saasden-backend

#### **Directory Organization**

```text
. [ROOT]
├── JS [Contains Helper functions for SSO and EMS integrations]
│   ├── EMS [Expense Management Systems]
│   │   ├── Xero
│   │   └── Zoho
│   └── SSO [Single Sign On(s), aka Identity and Access Management software]
│       ├── Azure
│       ├── JumpCloud
│       ├── Okta
│       ├── OneLogin
│       └── PingONE
├── README.md
├── app.js [Backend starts from here]
├── middleware [Middleware functions like checking Auth0 Token, setting organization ID in session]
│   └── middleware.js
├── models [MongoDB models here]
│   ├── employee.js [Employee -> App Mapping]
│   ├── organization.js [Data related to each organization, admin details,  EMS/SSO creds]
│   └── subscription.js [App -> Employee Mapping]
├── package.json
└── routes [Available Routes]
    ├── EMS [EMS creds input, getting access tokens]
    │   ├── Xero_route.js
    │   └── Zoho_route.js
    ├── SSO [SSO creds input, getting access tokens]
    │   ├── Azure_route.js
    │   ├── JumpCloud_route.js
    │   ├── Okta_route.js
    │   ├── OneLogin_route.js
    │   └── PingOne_route.js
    └── dashboard [The most called routes by frontend]
        ├── employee_route.js [Fetch data from employee document defined in model folder]
        ├── refresh_route.js [Query the EMS and SSO Apis and fetch the latest data and store it in DB]
        └── subscription_route.js [Fetch data from subscription document defined in model folder]
```
### **GIT HUB Details**
- Two Private  repos, backend and frontend
- Ask Rushant to be added as collaborators
- Master branch is the deployed branch, prefferably stage new changes in dev branch, make private changes on separate branches

### **AWS Configuration**
- Currently done with AWS EC2, but try going for AWS Amplify
- Finish writing the code in local environment, push to github, and connect to remote machine via vscode ssh extention for testing.
- If migrating to a new machine, need to configure nginx for deployment, refer the current configuration(/etc/nginx/sites-available/saasden.conf) for help.
- Need to change the IP address in the domain purchase site for a new machine, ask Rushant
- DO NOT FORGET TO SHUT DOWN IDLE AWS RESOURCES