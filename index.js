const dotenv = require("dotenv");
dotenv.config("./env");
require("./db");
const express = require("express");
const User = require("./db/models/userModel");
const app = express();
const http = require("http").Server(app);
const port = process.env.PORT || 9090;
const io = require("socket.io")(http);

app.use(express.json());

const { userRouter } = require("./db/routers/userRouter");
const { createToken } = require("./db/middleware");
const { getUserRedis } = require("./db/redis");
const Transaction = require("./db/models/transcationModel");
const Message = require("./db/models/messageModel");
const Trade = require("./db/models/tradeModel");

io.on("connection", (socket) => {
  console.log("user connected");
  userRouter(socket, io);

  socket.on("sendMessageToAdmin", async (data) => {
    const someUserSocketId = await getUserRedis(data.message._id);
    // someUserSocket.emit("getChatMsg", data.message);
    io.to(someUserSocketId).emit("getChatMsg", data.message);
    const message = new Message({
      from: data.message.user._id,
      text: data.message.text,
      image: data.message.image,
      createdAt: data.message.createdAt,
    });
    await message.save();
    if (data.type === "transaction") {
      const transaction = await Transaction.findOne({ _id: data.id });
      transaction.messages.push(message._id);
      await transaction.save();
    } else if (data.type === "trade") {
      const trade = await Trade.findOne({ _id: data.id });
      trade.messages.push(message._id);
      await trade.save();
    }
  });

  socket.on("sendChatMsg", async (data) => {
    console.log("sendChatMsg", data);
    const someUserSocketId = await getUserRedis(data.userId);
    console.log("someUserSocketId", someUserSocketId);
    // someUserSocket.emit("getChatMsg", data.message);
    io.to(someUserSocketId).emit("getChatMsg", data.message);
    const message = new Message({
      from: data.message.user._id,
      to: data.message._id,
      text: data.message.text,
      image: data.message.image,
      createdAt: data.message.createdAt,
    });
    await message.save();
    if (data.type === "transaction") {
      const transaction = await Transaction.findOne({ _id: data.id });
      transaction.messages.push(message._id);
      await transaction.save();
    } else if (data.type === "trade") {
      const trade = await Trade.findOne({ _id: data.id });
      trade.messages.push(message._id);
      await trade.save();
    }
  });
});

module.exports = { io };

app.get("/", (req, res) => res.send("Hi"));

app.post("/createUser", async (req, res) => {
  const data = req.body;
  try {
    const user = new User(data);
    await user.save();
    const token = await createToken(user._id);
    res.send({
      user: {
        _id: user._id,
        name: user.name,
        bitcoinsBought: user.bitcoinsBought,
        lastPrice: user.lastPrice,
        transactions: user.transactions,
      },
      token,
    });
  } catch (err) {
    res.send({ err: "An unexpected error occured" });
  }
});

http.listen(port, () => console.log("server running on", port));
