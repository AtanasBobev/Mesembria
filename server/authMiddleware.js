require('dotenv').config();
const jwt = require("jsonwebtoken");
const privateKey = process.env.PRIVATE_KEY;

const authorizeToken = (req, res, next) => {
  try {
    let decoded = jwt.verify(req.headers.jwt, privateKey);
    req.user = decoded.username;
    req.verified = decoded.verified;
    req.email = decoded.email;
    req.user_id = decoded.user_id;
    req.verified ? next() : res.status(401).send("Could not verify you!");
  } catch (err) {
    res.status(401).send("Could not verify you!");
    return err;
  }
};
module.exports = {
  authorizeToken,
};