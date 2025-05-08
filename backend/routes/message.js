const router =require("express").Router();
const messageController = require("../controllers/message");
const authorization = require("../middleware/authorisation");
const upload = require("../middleware/multer");
router.get("/conversations",authorization.protect, messageController.conversations);
router.get("/selectedConversation",authorization.protect, messageController.selectedConversation);
router.patch("/status",authorization.protect, messageController.status);
// router.patch("/message",authorization.protect, messageController.message);
// router.post("/group",authorization.protect, messageController.group);
router.get("/group",authorization.protect, messageController.groups);
router.patch("/members",authorization.protect, messageController.addmembers);
router.delete("/member",authorization.protect, messageController.removeMember);

router.get("/selectedGroup",authorization.protect, messageController.selectedGroupConversation);


module.exports = router
