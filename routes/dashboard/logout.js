import express from 'express'
const router = express.Router()

router.post('/logout', (req, res) => {
  req.session.destroy()
  res.send(200)
})
export { router }
