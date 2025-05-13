const router = require("express").Router();
const authController = require("../controllers/auth");
const authorization = require("../middleware/authorisation");
const upload = require("../middleware/multer");

router.post("/register",authorization.protect, upload.single("file"), authController.register);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/send-otp", authController.sendOtp);
router.post("/verifyOtp", authController.verifyOTP);
router.patch(
  "/profile",
  authorization.protect,
  upload.single("file"),
  authController.profileUpdate
);

module.exports = router;
