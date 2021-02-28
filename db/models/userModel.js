const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    phoneNumber: { unique: true, type: String, trim: true, required: true },
    name: { type: String, required: true },
    bitcoinsBought: { type: Number, required: false },
    lastPrice: { type: Number, required: false },
    transactions: [mongoose.Schema.Types.ObjectId],
    listings: [mongoose.Schema.Types.ObjectId],
    trades: [mongoose.Schema.Types.ObjectId],
    notificationId: { type: String, required: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
