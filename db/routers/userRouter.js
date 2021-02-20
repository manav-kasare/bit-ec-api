const { createToken, verifyToken } = require("../middleware/index.js");
const Message = require("../models/messageModel.js");
const Transaction = require("../models/transcationModel.js");
const User = require("../models/userModel.js");
const { setUserRedis, getUserRedis } = require("../redis.js");

const userRouter = (socket) => {
  socket.on("connected", (id) => {
    setUserRedis(id, socket);
  });

  socket.on("getAwsKeys", (data, callback) => {
    callback({
      accessKey: process.env.ACCESS_KEY,
      secretKey: process.env.SECRET_KEY,
    });
  });

  socket.on("createUser", async (data, callback) => {
    try {
      const user = new User(data);
      await user.save();
      const token = await createToken(user._id);
      callback({
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
      callback({ err: "An unexpected error occured" });
    }
  });

  socket.on("updateUser", async ({ token, data }, callback) => {
    try {
      const _id = verifyToken(token);
      if (_id) {
        const user = await User.findOne({ _id });
        for (key in data) {
          user[`${key}`] = data[`${key}`];
        }
        callback({ user });
        await user.save();
      } else {
        callback({ err: "Please authenticate" });
      }
    } catch (err) {
      callback({ err: "An unexpected error occured" });
    }
  });

  socket.on("getUserByPhone", async (phoneNumber, callback) => {
    try {
      const user = await User.findOne({ phoneNumber });
      if (!user) return callback({ err: "User does not exist" });
      else
        return callback({
          user: {
            _id: user._id,
            name: user.name,
          },
        });
    } catch (err) {
      callback({ err: "An unexpected error occured" });
    }
  });

  socket.on("getUserByToken", async (token, callback) => {
    try {
      const _id = verifyToken(token);
      const user = await User.findOne({ _id });
      if (!user) return callback({ err: "User does not exist" });
      else
        return callback({
          user,
        });
    } catch (err) {
      callback({ err: "An unexpected error occured" });
    }
  });

  socket.on("getUserById", async (_id, callback) => {
    try {
      const user = await User.findOne({ _id });
      if (!user) return callback({ err: "User does not exist" });
      else
        return callback({
          user: {
            _id: user._id,
            name: user.name,
            bitcoinsBought: user.bitcoinsBought,
            lastPrice: user.lastPrice,
            transactions: user.transactions,
          },
        });
    } catch (err) {
      callback({ err: "An unexpected error occured" });
    }
  });

  socket.on("buy", async (data, callback) => {
    try {
      const user = await User.findById(data.userId);
      const transaction = new Transaction({
        userId: data.userId,
        numberOfBitcoins: data.numberOfBitcoins,
        atPrice: data.atPrice,
        type: "buy",
        status: "pending",
      });
      user.transactions.push(transaction._id);
      user.bitcoinsBought = user.bitcoinsBought + data.numberOfBitcoins;
      user.lastPrice = data.atPrice;
      await transaction.save();
      callback({ user, transactionId: transaction._id });
      await user.save();
    } catch (err) {
      console.log(err);
      callback({ err: "Transaction failed !" });
    }
  });

  socket.on("sell", async (data, callback) => {
    try {
      const user = await User.findById(data.userId);
      const transaction = new Transaction({
        userId: data.userId,
        numberOfBitcoins: data.numberOfBitcoins,
        atPrice: data.atPrice,
        type: "sell",
        status: "pending",
      });
      user.transactions.push(transaction._id);
      user.bitcoinsBought = user.bitcoinsBought - data.numberOfBitcoins;
      user.lastPrice = data.atPrice;
      await transaction.save();
      callback({ user });
      await user.save();
    } catch (err) {
      callback({ err: "Transaction failed !" });
    }
  });

  socket.on("sendMessageToAdmin", async (data) => {
    const someUserSocket = await getUserRedis(data.message._id);
    someUserSocket.emit("getMessage", data.message);
    const message = new Message({
      from: data.message.user._id,
      text: data.message.text,
      image: data.message.image,
      createdAt: data.message.createdAt,
    });
    await message.save();
    const transaction = await Transaction.findOne({ _id: data.transactionId });
    transaction.messages.push(message._id);
    await transaction.save();
  });

  socket.on("getTransaction", async (id, callback) => {
    try {
      const transaction = await Transaction.findById(id);
      callback({ transaction });
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("getPendingTransactions", async (data, callback) => {
    try {
      const transactions = await Transaction.find({ status: "pending" });
      callback({ transactions });
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("approve", async (id, callback) => {
    try {
      const transaction = await Transaction.findById(id);
      transaction.status = "approved";
      callback({ transaction });
      await transaction.save();
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("decline", async (id, callback) => {
    try {
      const transaction = await Transaction.findById(id);
      transaction.status = "declined";
      callback({ transaction });
      await transaction.save();
    } catch (err) {
      callback({ err });
    }
  });
};

module.exports = { userRouter };
