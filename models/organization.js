import mongoose from 'mongoose'
const Schema = mongoose.Schema

const orgModel = new Schema({
  ID: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    require: true
  },
  ssoData: [{
    ssoName: String,
    clientID: String,
    clientSecret: String,
    tenantID: String,
    domain: String,
    apiToken: String
  }],
  emsData: {
    emsName: String,
    clientID: String,
    clientSecret: String,
    tenantID: String,
    domain: String,
    apiToken: String
  }
})

const orgSchema = mongoose.model('orgSchema', orgModel)
export default orgSchema
