const passport = require('passport')
const router = require('express').Router()
const userModel = require('../../models/user')

router.post('/signup', (req, res, next) => {
  console.log(req.body)
  userModel.register({
    username: req.body.username,
    name: req.body.name,
    companyName: req.body.companyName,
    workEmail: req.body.workEmail
  }, req.body.password, (err) => {
    if (err) {
      console.log('Error in Signup')
      res.sendStatus(500)
      return next(err)
    } else {
      res.sendStatus(200)
    }
  })
})

router.post('/login', passport.authenticate('local', { failureRedirect: '' }), async (req, res) => { // put login route of frontend here
  console.log(req.body)
  const user = await userModel.findOne({ username: req.body.username })
  res.cookie('username', req.body.username)
  res.cookie('user_saasden_id', user._id)
  res.sendStatus(200)
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.sendStatus(200)
})

module.exports = router
