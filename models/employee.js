const mongoose = require('mongoose')
const Schema = mongoose.Schema
const userSchema = require('./user')

const empSchema = new Schema({
  saasdenID: {
    type: Schema.Types.ObjectId,
    ref: userSchema,
    required: true
  },
  emps: [{
    id: String,
    email: String,
    firstname: String,
    username: String,
    lastname: String,
    apps: [{
      id: String,
      name: String
    }]
  }]
})

module.exports = mongoose.model('empSchema', empSchema)
