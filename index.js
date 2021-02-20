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

io.on("connection", (socket) => {
  console.log("user connected");
  userRouter(socket);
});

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
