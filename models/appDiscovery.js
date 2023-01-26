import mongoose from 'mongoose'
const Schema = mongoose.Schema

const appDiscoveryModel = new Schema({
  ID: {
    type: String,
    unique: true,
    required: true
  },
  discovery: {
    discName: String,
    url: String,
    apps: [{ name: String }]
  }
})

const appDiscoverySchema = mongoose.model('appDiscoverySchema', appDiscoveryModel)
export default appDiscoverySchema
