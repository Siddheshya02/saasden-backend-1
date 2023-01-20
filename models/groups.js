import mongoose from 'mongoose'
const Schema = mongoose.Schema

const groupModel = new Schema({
  ID: {
    type: String,
    unique: true,
    required: true
  },
  groups: [{
    name: String,
    groupId: String,
    source: String,
    emps: [{
      id: String,
      email: String,
      firstname: String,
      username: String,
      lastname: String
    }],
    apps: [{
      id: String,
      name: String
    }]
  }]
})
const groupSchema = mongoose.model('groupSchema', groupModel)
export default groupSchema
