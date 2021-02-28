const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema(
  {
    userId: { type: String },
    amount: { type: Number },
    atPrice: { type: Number },
    type: { type: String },
    status: { type: String },
    messages: [mongoose.Schema.Types.ObjectId],
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
