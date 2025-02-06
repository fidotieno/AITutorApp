const bcrypt = require('bcryptjs');
const Mongoose = require("mongoose");

const AdminSchema = Mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePhoto: {
    type: String, 
    required: false,
  }
});

AdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = Mongoose.model("Admin", AdminSchema);