const mongoose = require('mongoose')
const Schema = mongoose.Schema
const userSchema = require('./user')

const emsSchema = new Schema({
  saasdenID: {
    type: Schema.Types.ObjectId,
    ref: userSchema,
    required: true
  },
  domain: {
    type: String
  },
  envID: {
    type: String
  },
  clientID: {
    type: String
  },
  clientSecret: {
    type: String
  },
  apiToken: {
    type: String
  }
})

module.exports = mongoose.model('emsSchema', emsSchema)
