const jwt = require('jsonwebtoken')
const userModel = require("../model/user")


const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '')
    const decoded = jwt.verify(token, 'matcha')
    const user = await userModel.userCheck(decoded._id, token)
    req.user = user
    req.token = token
    next()
  }
  catch (e) {
    res.status(401).send({Code:401, Error: 'Please Login'})
  }
}

module.exports = auth