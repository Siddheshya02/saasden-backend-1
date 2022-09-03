const mongoose = require('mongoose')
const Schema = mongoose.Schema
const userSchema = require('./user')

const subsSchema = new Schema({
  user_saasden_id: {
    type: Schema.Types.ObjectId,
    ref: userSchema,
    required: true
  },
  apps: [{
    name: String,
    ssoID: String,
    emsID: String,
    emps: [{
      id: String,
      email: String,
      firstname: String,
      username: String,
      lastname: String
    }],
    licences: Number,
    currentCost: Number,
    amountSaved: Number,
    dueData: String
  }]
})

module.exports = mongoose.model('subSchema', subsSchema)
