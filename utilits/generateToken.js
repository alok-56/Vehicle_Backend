const jwt = require("jsonwebtoken");
const { encryptData } = require("./Encryption");
require("dotenv").config();
const GenerateToken = async (id) => {
  let token = jwt.sign(
    {
      data: id,
    },
    process.env.JWT_SCRECT,
    { expiresIn: "60h" }
  );
  let encrypttoken = await encryptData(token);
  return encrypttoken;
};

module.exports = GenerateToken;
