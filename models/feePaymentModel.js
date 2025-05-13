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
      required: true, // e.g. "Term 1 - 2025"
    },
    isPaidInFull: {
      type: Boolean,
      required: true,
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
