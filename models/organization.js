import mongoose from 'mongoose'
const Schema = mongoose.Schema

const orgModel = new Schema({
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
    tenantID: String,
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

const orgSchema = mongoose.model('orgSchema', orgModel)
export default { orgSchema }
