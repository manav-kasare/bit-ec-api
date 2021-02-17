const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    phoneNumber: { unique: true, type: String, trim: true, required: true },
    name: { type: String, required: true },
    bitcoinsBought: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
