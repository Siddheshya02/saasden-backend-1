import jwt_decode from 'jwt-decode'

// set organizationID in the session
export function setOrgName (req, res, next) {
  const auth0_tokenSet = jwt_decode(req.get('Authorization'))
  req.session.orgID = auth0_tokenSet.org_id
  req.session.sso_domain = 'saasdenbits-dev.onelogin.com'
  req.session.sso_clientID = '45bba86eec3e9d1b3643175ce317ead17596f66e30fdd7a0f8a2c9fbf9411690'
  req.session.sso_clientSecret = '754a02f204451ed03e2b996803cc4e4a19366a7f41db3eedb8fa8e31bb338e2c'
  req.session.sso_name = 'onelogin'
  req.session.sso_accessToken = '8bf329082f259c8cd5716540148a403746d2006eb40dea22f939fb77a2f1b59b'
  req.session.sso_refreshToken = '2ae4a05ec58ce089614dfc2556354422e5d21fab6349fcc70f176fdb9243f41f'
  console.log(req.session)
  next()
}

// Check if ems or sso creds are present or not
export function checkStatus (req, res, next) {
  if (req.session.sso_name && req.session.ems_name) {
    next()
  } else if (!req.session.sso_name) {
    res.sendStatus(420)
  } else { res.sendStatus(421) }
}
// NOTE: Add your errors here
export function handleErrors (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('Invalid Token ')
  } else {
    next(err)
  }
}
