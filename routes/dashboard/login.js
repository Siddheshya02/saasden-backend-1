const passport = require('passport')
const router = require('express').Router()
const userModel = require('../../models/user')
const ssoModel = require('../../models/sso')
const emsModel = require('../../models/ems')
const subModel = require('../../models/subscription')
const empModel = require('../../models/employee')

router.post('/signup', (req, res, next) => {
  userModel.register({
    username: req.body.username,
    name: req.body.name,
    companyName: req.body.companyName,
    workEmail: req.body.workEmail
  }, req.body.password, async (err, user) => {
    if (err) {
      console.log('Error in Signup')
      res.sendStatus(500)
      return next(err)
    } else {
      try {
        await ssoModel.create({ saasdenID: user._id })
        await emsModel.create({ saasdenID: user._id })
        await subModel.create({ saasdenID: user._id })
        await empModel.create({ saasdenID: user._id })
        console.log(user.name + ' signed up')
        res.sendStatus(200)
      } catch (error) {
        console.log(error)
        res.sendStatus(500)
      }
    }
  })
})

router.post('/login', passport.authenticate('local', { failureRedirect: '' }), async (req, res) => { // put login route of frontend here
  const user = await userModel.findOne({ username: req.body.username })
  res.cookie('username', user.username)
  res.cookie('saasdenID', user._id)
  console.log(user.username + ' logged in')
  res.sendStatus(200)
})

router.get('/logout', (req, res) => {
  console.log(req.cookies.username + ' logged out')
  req.session.destroy()
  res.clearCookie('username')
  res.clearCookie('saasdenID')
  res.sendStatus(200)
})

module.exports = router
