const dotenv = require("dotenv");
dotenv.config("./env");
require("./db");
const axios = require("axios").default;
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const port = process.env.PORT || 9090;
const io = require("socket.io")(http);

const { userRouter } = require("./db/routers/userRouter");

io.on("connection", (socket) => {
  userRouter(socket);
});

server.listen(port, () => console.log("server running on", port));

// axios
//   .get(
//     `https://api.nomics.com/v1/currencies/ticker?key=${process.env.API_KEY}&ids=BTC,ETH,XRP&interval=1d,30d&convert=EUR&per-page=100&page=1`
//   )
//   .then((response) => {
//     console.log(response.data[0].price);
//   });
