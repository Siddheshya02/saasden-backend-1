import mongoose from 'mongoose'
const Schema = mongoose.Schema

const empModel = new Schema({
  ID: {
    type: String,
    unique: true,
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

const empSchema = mongoose.model('empSchema', empModel)
export default empSchema
