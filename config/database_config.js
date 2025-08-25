const mongoose = require("mongoose");
require("dotenv").config();

const Databaseconnect = async () => {
  try {
    let connection = await mongoose.connect(process.env.DATABASE_URL);
    if (connection) {
      
      console.log("database connected successfully");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = Databaseconnect;
