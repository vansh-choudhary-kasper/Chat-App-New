const router = require("express").Router();
const authController = require("../controllers/user");
const upload = require("../middleware/multer");
const authorization = require("../middleware/authorisation");

router.get("/users",authorization.protect, authController.users);
router.get("/user",authorization.protect, authController.user);
router.get("/verify",authorization.protect, authController.verify);




module.exports=router
