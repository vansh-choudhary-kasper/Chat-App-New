const User = require("../models/user");
const OneToOneMessage = require("../models/OneToOneMessage");
const GroupMessage = require("../models/GroupMessage");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp -activeToken");
    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};

exports.getAllPersonalChats = async (req, res) => {
  try {
    const personalChats = await OneToOneMessage.find()
      .populate("participants", "firstname lastname _id status socket_id profile")
      .select({ messages: { $slice: -5 } });
    res.status(200).json({
      status: "success",
      data: personalChats,
    });
  } catch (error) {
    console.error("Error fetching personal chats:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};

exports.getAllGroupChats = async (req, res) => {
  try {
    const groupChats = await GroupMessage.find()
      .populate("participants.user", "firstname lastname _id status socket_id profile")
      .select({ messages: { $slice: -5 } });
    res.status(200).json({
      status: "success",
      data: groupChats,
    });
  } catch (error) {
    console.error("Error fetching group chats:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};

exports.getAdminData = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp -activeToken");
    const personalChats = await OneToOneMessage.find()
      .populate("participants", "firstname lastname _id status socket_id profile");
      // .select({ messages: { $slice: -5 } });
    const groupChats = await GroupMessage.find()
      .populate("participants.user", "firstname lastname _id status socket_id profile");
      // .select({ messages: { $slice: -5 } });

    res.status(200).json({
      status: "success",
      data: {
        users,
        personalChats,
        groupChats,
      },
    });
  } catch (error) {
    console.error("Error fetching admin data:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};
