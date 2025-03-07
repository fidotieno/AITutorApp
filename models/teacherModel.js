const bcrypt = require("bcryptjs");
const Mongoose = require("mongoose");

const TeacherSchema = Mongoose.Schema(
  {
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
      url: { type: String, required: false },
      name: { type: String, required: false },
    },
    coursesCreated: [{ type: Mongoose.Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true }
);

TeacherSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = Mongoose.model("Teacher", TeacherSchema);
