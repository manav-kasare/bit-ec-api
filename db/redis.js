const redis = require("redis");
const redisClient = redis.createClient();
const circularJson = require("circular-json");

const setUserRedis = (id, value) => {
  redisClient.set(`user:${id}`, value);
};

const getUserRedis = async (id) => {
  let user;
  const promise = new Promise((resolve) => {
    redisClient.get(`user:${id}`, (err, res) => {
      user = res;
      resolve();
    });
  });
  return promise.then(() => user);
};

module.exports = { setUserRedis, getUserRedis };
