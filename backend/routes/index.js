const router = require("express").Router();
const authRouter = require("./auth")
const userRouter = require("./user")
const messageRouter = require("./message")



router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/user", messageRouter);


module.exports = router;