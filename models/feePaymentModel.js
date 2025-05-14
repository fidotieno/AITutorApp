const mongoose = require("mongoose");

const FeePaymentSchema = mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    term: {
      type: String,
      default: "School Fee Payment",
    },
    isPaidInFull: {
      type: Boolean,
      default: true,
    },
    datePaid: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String, // e.g., "Mpesa", "Bank", "Cash"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeePayment", FeePaymentSchema);
