const jwt = require("jsonwebtoken");
require("dotenv").config();
const GenerateToken = (id) => {
  let token = jwt.sign(
    {
      data: id,
    },
    process.env.JWT_SCRECT,
    { expiresIn: "60h" }
  );
  return token;
};

module.exports = GenerateToken;
