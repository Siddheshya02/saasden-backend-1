const mongoose = require('mongoose')
const Schema = mongoose.Schema

const orgSchema = new Schema({
  name: {
    type: String
  },
  users: [{
    name: String,
    email: String,
    role: String
  }],
  ssoData: {
    ssoName: String,
    clientID: String,
    clientSecret: String,
    domain: String,
    apiToken: String
  },
  emsData: {
    emsName: String,
    clientID: String,
    clientSecret: String,
    domain: String,
    apiToken: String
  }
})

module.exports = mongoose.model('orgSchema', orgSchema)
