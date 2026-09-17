const mongoose = require("mongoose");
const env = require("./env");

async function connectDb() {
  if (!env.mongoUri) {
    return { mode: "memory" };
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, { dbName: "packzip" });
  return { mode: "mongo" };
}

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDb, isMongoReady };
