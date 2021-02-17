const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema({}, { timestamps: true });

const Transaction = mongoose.model("User", transactionSchema);

module.exports = Transaction;
