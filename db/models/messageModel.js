const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    from: { type: String },
    to: { type: String },
    text: { type: String },
    image: { type: String },
    createdAt: { type: Date },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
