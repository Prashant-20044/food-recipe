const jwt = require("jsonwebtoken")

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or malformed" })
  }

  const token = authHeader.split(" ")[1]
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" })
    }

    req.user = decoded
    next()
  })
}

module.exports = verifyToken