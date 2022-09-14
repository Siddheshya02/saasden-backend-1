function checkAuthentication (req, res, next) {
  const sessID = req.cookies.sessID
  if (req.session.sessID === undefined) {
    res.sendStatus(401)
  } else if (req.session.sessID === sessID) {
    res.sendStatus(403)
  } else {
    next()
  }
}

module.exports = { checkAuthentication }
