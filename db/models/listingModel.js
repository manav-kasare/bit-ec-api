const mongoose = require("mongoose");

const listingSchema = mongoose.Schema(
  {
    from: { type: String, required: true },
    type: { type: String, required: true },
    atPrice: { type: Number, required: true },
    amount: { type: Number, required: true },
    createdAt: { type: Date },
  },
  { timestamps: true }
);

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
