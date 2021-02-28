const mongoose = require("mongoose");

const tradeSchema = mongoose.Schema(
  {
    creator: { type: String, required: true },
    trader: { type: String, required: true },
    type: { type: String, required: true },
    atPrice: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String },
    createdAt: { type: Date },
    messages: [mongoose.Schema.Types.ObjectId],
  },
  { timestamps: true }
);

const Trade = mongoose.model("Trade", tradeSchema);

module.exports = Trade;
