const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    from: { type: String, required: true },
    text: { type: String, required: false },
    image: { type: String, required: false },
    createdAt: { type: Date },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
