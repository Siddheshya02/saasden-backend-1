import jwt_decode from 'jwt-decode'

// set organizationID in the session
export function setOrgName (req, res, next) {
  const auth0_tokenSet = jwt_decode(req.get('Authorization'))
  req.session.orgID = auth0_tokenSet.org_id
  next()
}
export function setSSOData (req, res, next) {
  const auth0_tokenSet = jwt_decode(req.get('Authorization'))
  console.log(auth0_tokenSet)
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
