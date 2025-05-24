const bcrypt = require("bcryptjs");
const Mongoose = require("mongoose");

const StudentSchema = Mongoose.Schema(
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
    parentEmail1: { type: String, required: false },
    parentEmail2: { type: String, required: false },
    enrolledCourses: [{ type: Mongoose.Schema.Types.ObjectId, ref: "Course" }],
    pendingEnrollments: [
      { type: Mongoose.Schema.Types.ObjectId, ref: "Course" },
    ],
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

StudentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = Mongoose.model("Student", StudentSchema);
