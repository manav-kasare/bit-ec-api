const { createToken } = require("../middleware/index.js");
const User = require("../models/userModel.js");

const userRouter = (socket) => {
  socket.on("createUser", async (data, callback) => {
    try {
      const user = new User(data);
      await user.save();
      const token = await createToken(user._id);
      callback({ user, token });
    } catch (err) {
      callback({ err: "An unexpected error occured" });
    }
  });

  socket.on("getUserByPhone", async (phoneNumber) => {
    try {
      const user = await User.findOne({ phoneNumber });
      if (!user) return callback({ err: "User does not exist" });
      else return callback({ user });
    } catch (err) {
      callback({ err: "An unexpected error occured" });
    }
  });
};

module.exports = { userRouter };
