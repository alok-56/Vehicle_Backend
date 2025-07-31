const jwt = require("jsonwebtoken");
require("dotenv").config();

const VerifyToken = (token) => {
  try {
    var decoded = jwt.verify(token, process.env.JWT_SCRECT);
    return decoded;
  } catch (error) {
    return error;
  }
};

module.exports = VerifyToken;
