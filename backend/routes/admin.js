const router = require("express").Router();
const adminController = require("../controllers/admin");
const authorization = require("../middleware/authorisation");

// Protect all admin routes
router.use(authorization.protect);
router.use(authorization.restrictTo("admin"));

// Get all users
router.get("/users", adminController.getAllUsers);

// Get all personal chats
router.get("/personal-chats", adminController.getAllPersonalChats);

// Get all group chats
router.get("/group-chats", adminController.getAllGroupChats);

// Get combined admin data
router.get("/data", adminController.getAdminData);

module.exports = router;
