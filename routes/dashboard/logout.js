import express from 'express'
const router = express.Router()

router.post('/logout', (req, res) => {
  req.session.destroy()
  console.log('User logged out')
  res.send(200)
})
export { router }
