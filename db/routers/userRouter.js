const { createToken, verifyToken } = require("../middleware/index.js");
const Listing = require("../models/listingModel.js");
const Trade = require("../models/tradeModel.js");
const Transaction = require("../models/transcationModel.js");
const User = require("../models/userModel.js");
const Message = require("../models/messageModel");
const { setUserRedis, getUserRedis } = require("../redis.js");

const adminId = process.env.ADMIN_ID;

const userRouter = (socket) => {
  socket.on("connected", (id) => {
    console.log("setUserRedis", id, socket.id);
    setUserRedis(id, socket.id);
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
        user,
        token,
      });
    } catch (err) {
      callback({ err: "An unexpected error occured" });
    }
  });

  socket.on("loginUser", async (phoneNumber, callback) => {
    try {
      const user = await User.findOne({ phoneNumber });
      console.log("user", user);
      const token = await createToken(user._id);
      console.log("token", token);
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

  socket.on("getAdmin", async (data, callback) => {
    try {
      const admin = await User.findById(adminId);
      // const admin = await User.findById('6030f1846953581aff77df42')
      callback({ admin });
    } catch (err) {
      callback({ err });
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
      // user.bitcoinsBought = user.bitcoinsBought + data.numberOfBitcoins;
      // user.lastPrice = data.atPrice;
      callback({ user, transactionId: transaction._id });
      await transaction.save();
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
      callback({ user });
      await transaction.save();
      await user.save();
    } catch (err) {
      callback({ err: "Transaction failed !" });
    }
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
      console.log("transactions", transactions);
      const ids = transactions.map(({ _id }) => _id);
      callback({ transactions: ids });
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("approveTransaction", async (id, callback) => {
    try {
      const transaction = await Transaction.findById(id);
      transaction.status = "approved";
      callback({ transaction });
      const user = await User.findById(transaction.userId);
      user.bitcoinsBought =
        user.bitcoinsBought + transaction.amount / transaction.atPrice;
      user.lastPrice = transaction.atPrice;
      await transaction.save();
      await user.save();
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("declineTransaction", async (id, callback) => {
    try {
      const transaction = await Transaction.findById(id);
      transaction.status = "declined";
      callback({ transaction });
      await transaction.save();
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("approveTrade", async (id, callback) => {
    try {
      const trade = await Trade.findById(id);
      trade.status = "approved";
      callback({ trade });
      trade.save();

      // Creator
      const creator = await User.findById(trade.creator);
      if (trade.type === "buy") {
        creator.numberOfBitcoins =
          creator.numberOfBitcoins + trade.amount / trade.atPrice;
      } else if (trade.type === "sell") {
        creator.numberOfBitcoins =
          creator.numberOfBitcoins - trade.amount / trade.atPrice;
      }
      creator.lastPrice = trade.atPrice;
      creator.save();
      // Trader
      const trader = await User.findById(trade.trader);
      if (trade.type === "buy") {
        trader.numberOfBitcoins =
          trader.numberOfBitcoins - trade.amount / trade.atPrice;
      } else if (trade.type === "sell") {
        trader.numberOfBitcoins =
          trader.numberOfBitcoins + trade.amount / trade.atPrice;
      }
      trader.lastPrice = trade.atPrice;
      trader.save();
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("declineTrade", async (id, callback) => {
    try {
      const trade = await Trade.findById(id);
      trade.status = "declined";
      callback({ trade });
      trade.save();
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("addListing", async (data, callback) => {
    try {
      const listing = new Listing(data);
      const user = await User.findById(data.from);
      user.listings.indexOf(listing._id) === -1 &&
        user.listings.push(listing._id);
      callback({ user });
      await listing.save();
      await user.save();
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("getSellListings", async (data, callback) => {
    try {
      const listings = await Listing.find({ type: "sell" });
      const newListings = listings.map(({ _id }) => _id);
      callback({ listings: newListings });
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("getBuyListings", async (data, callback) => {
    try {
      const listings = await Listing.find({
        type: "buy",
        amount: { $lt: data.limit },
      });
      const newListings = listings.map(({ _id }) => _id);
      callback({ listings: newListings });
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("getListing", async (_id, callback) => {
    try {
      const listing = await Listing.findById(_id);
      callback({ listing });
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("trade", async (data, callback) => {
    try {
      const trade = new Trade(data);
      const user = await User.findOne({ _id: data.trader });
      if (user.trades.indexOf(trade._id) === -1) user.trades.push(trade._id);
      callback({ user, tradeId: trade._id });
      await trade.save();
      await user.save();
      const listing = new Listing.findById(data.tradeId);
      listing.status = "ongoing";
      listing.save();
      const creator = await User.findOne({ id: data.creator });
      const index = creator.listings.indexOf(data.listingId);
      creator.listings.splice(index, 1);
      creator.trades.push(trade._id);
      creator.save();
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("getTrade", async (_id, callback) => {
    try {
      const trade = await Trade.findById(_id);
      callback({ trade });
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("getPendingTrades", async (data, callback) => {
    try {
      const trades = await Trade.find({ status: "pending" });
      const ids = trades.map(({ _id }) => _id);
      callback({ trades: ids });
    } catch (err) {
      callback({ err });
    }
  });

  socket.on("notifyAdmin", async (data, callback) => {
    const admin = await getUserRedis(adminId);
    if (admin) {
      admin.emit("message", data);
    }
  });

  socket.on("getMessage", async (id, callback) => {
    try {
      const message = await Message.findById(id);
      callback({ message });
    } catch (err) {
      callback({ err });
    }
  });
};

module.exports = { userRouter };
