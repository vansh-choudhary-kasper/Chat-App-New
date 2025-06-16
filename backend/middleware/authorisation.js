const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let user = await User.findById(decoded.userId);
    if(user.activeToken !== token){
      return res.status(401).json({ message: 'Token invalid or expired' });
    }
      
    req.user_id = decoded.userId;

    next();
  });
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user_id) {
      return res.status(401).json({ message: "Unauthorized3" });
    }
    User.findById(req.user_id).then(user => {
      if (!user || !roles.includes(user.access)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    }).catch(err => {
      return res.status(500).json({ message: "Server error" });
    });
  };
};
