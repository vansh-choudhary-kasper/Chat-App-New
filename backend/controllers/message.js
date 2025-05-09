const uploadToCloudinary = require("../middleware/cloudinary");
const OneToOneMessage = require("../models/OneToOneMessage");
const GroupMessage = require("../models/GroupMessage");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { io } = require("../utils/socket");

exports.conversations = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim() === "") {
      res.status(400).json({
        status: "failed",
        message: "Search is required",
      });
      return;
    }

    const conversation = await OneToOneMessage.find({
      participants: { $all: [search] },
    })
      .populate(
        "participants",
        "firstname lastname _id status socket_id profile"
      )
      .select({ messages: { $slice: -5 } });

    if (conversation.length === 0) {
      res.status(404).json({
        status: "failed",
        message: "No Conversation found",
        data: [],
      });
      return;
    }

    const reversedConversations = conversation.map((conv) => {
      const reversedMessages = [
        ...conv.messages.map((val) => {
          if (val.status === "delete") {
            return {
              seen: val.seen || "unseen",
              to: val.to,
              from: val.from,
              type: "text",
              created_at: val.created_at,
              text: "This message is deleted",
              _id: val._id,
              status: "delete",
            };
          } else {
            return val;
          }
        }),
      ].reverse();

      const filteredParticipants = conv.participants.filter(
        (participant) => participant._id.toString() !== search
      );

      return {
        ...conv.toObject(),
        messages: reversedMessages,
        participants: filteredParticipants,
      };
    });

    res.status(200).json({
      status: "success",
      data: reversedConversations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};
exports.selectedConversation = async (req, res) => {
  try {
    const { search, userid } = req.query;

    if (!search || search.trim() === "") {
      return res.status(400).json({
        status: "failed",
        message: "Search is required",
      });
    }

    const conversation = await OneToOneMessage.findOne({
      _id: search,
      participants: userid,
    }).populate(
      "participants",
      "firstname lastname _id status socket_id profile about"
    );

    if (!conversation) {
      return res.status(404).json({
        status: "failed",
        message: "No Conversation found",
        data: [],
      });
    }

    let messagesUpdated = false;
    conversation.messages.forEach((message) => {
      // If the message is received by the user and unseen, mark it as seen
      if (message.to.toString() === userid && message.seen.length === 0) {
        message.seen.push(userid);
        messagesUpdated = true;
      }
    });

    const reversedMessages = conversation.messages
      .map((message) => {
        if (message.status === "delete") {
          return {
            seen: message.seen || "unseen",
            to: message.to,
            from: message.from,
            type: "text",
            created_at: message.created_at,
            text: "This message is deleted",
            _id: message._id,
            status: "delete",
          };
        }
        return message;
      })
      .reverse();

    const filteredParticipants = conversation.participants.filter(
      (participant) => participant._id.toString() !== search
    );

    const reversedConversation = {
      ...conversation.toObject(),
      messages: reversedMessages,
      participants: filteredParticipants,
    };

    if (messagesUpdated) {
      await conversation.save();
    }

    return res.status(200).json({
      status: "success",
      data: [reversedConversation],
    });
  } catch (error) {
    console.error("Error in selectedConversation:", error);
    return res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};

exports.status = async (req, res) => {
  try {
    const { search, status } = req.query;

    const { userId } = req.body;
    if (!search || search.trim() === "") {
      return res.status(400).json({
        status: "failed",
        message: "Search is required",
      });
    }

    if (status === "chat") {
      await OneToOneMessage.findByIdAndUpdate(
        { _id: search },
        { $pull: { status: userId } },
        { runValidators: true }
      );
    } else if (status === "archive") {
      await OneToOneMessage.findByIdAndUpdate(
        { _id: search },
        { $addToSet: { status: userId } },
        { runValidators: true }
      );
    }

    return res.status(200).json({
      status: "success",
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};

exports.group = async (req, res) => {
  const { groupName, groupMember } = req.body;
  if (!groupName || groupMember.length < 3) {
    res.status(400).json({
      status: "fail",
      message: "minimum members or group name is missing",
    });
    return;
  }
  try {
    const members = groupMember.map((val) => {
      return val._id;
    });
    const group = await GroupMessage.create({
      participants: [...members],
      groupName,
    });
    res.status(200).json({
      message: "Group Created",
      status: "success",
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};
exports.groups = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search || search.trim() === "") {
      res.status(400).json({
        status: "failed",
        message: "Search is required",
      });
      return;
    }

    const conversation = await GroupMessage.find({
      "participants.user": { $in: [search] },
    })
      .populate(
        "participants.user",
        "firstname lastname _id status socket_id profile"
      )
      .select({ messages: { $slice: -5 } });
    if (conversation.length === 0) {
      res.status(404).json({
        status: "failed",
        message: "No Group found",
        data: [],
      });
      return;
    }

    const reversedConversations = conversation.map((conv) => {
      const reversedMessages = [
        ...conv.messages.map((val) => {
          if (val.status === "delete") {
            return {
              seen: val.seen || "unseen",
              to: val.to,
              from: val.from,
              type: "text",
              created_at: val.created_at,
              text: "This message is deleted",
              _id: val._id,
              status: "delete",
            };
          } else {
            return val;
          }
        }),
      ].reverse();

      const filteredParticipants = conv.participants.filter(
        (participant) => participant._id.toString() !== search
      );

      return {
        ...conv.toObject(),
        messages: reversedMessages,
        participants: filteredParticipants,
      };
    });

    res.status(200).json({
      status: "success",
      data: reversedConversations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};
exports.addmembers = async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    const { membersList } = req.body;
    // Validate input
    if (
      !userId ||
      !groupId ||
      !membersList ||
      !Array.isArray(membersList) ||
      membersList.length === 0
    ) {
      return res.status(400).json({
        status: "failed",
        message:
          "Invalid input. Provide userId, groupId, and a valid membersList.",
      });
    }

    // Fetch the group and validate the requesting user's role
    const group = await GroupMessage.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: "failed",
        message: "Group not found.",
      });
    }

    const requestingUser = group.participants.find(
      (participant) => participant.user.toString() === userId
    );

    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(401).json({
        status: "failed",
        message: "You are not authorized to add members to this group.",
      });
    }

    const existingMemberIds = group.participants.map((participant) =>
      participant.user.toString()
    );
    const uniqueNewMembers = membersList.filter(
      (memberId) => !existingMemberIds.includes(memberId)
    );

    if (uniqueNewMembers.length === 0) {
      return res.status(400).json({
        status: "failed",
        message: "All members are already in the group.",
      });
    }

    const participantsToAdd = uniqueNewMembers.map((memberId) => ({
      user: new mongoose.Types.ObjectId(memberId),
      role: "member",
    }));

    // without password
    let newMembers = await User.find({ _id: { $in: uniqueNewMembers } }).select('-password');
    newMembers = newMembers.map((user) => ({
      user,
      role: "member",
    }));

    io.to(newMembers.map(val => val.user.socket_id)).emit("group_added_you", { group });

    group.participants.push(...participantsToAdd);
    await group.save();
    res.status(200).json({
      message: "Members added successfully",
      status: "success",
      newMembers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};
exports.removeMember = async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    const { member } = req.body;

    if (
      !userId ||
      !groupId ||
      !member
    ) {
      return res.status(400).json({
        status: "failed",
        message:
          "Invalid input. Provide userId, groupId, and a valid member.",
      });
    }

    const group = await GroupMessage.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: "failed",
        message: "Group not found.",
      });
    }

    const requestingUser = group.participants.find(
      (participant) => participant.user.toString() === userId
    );
    
    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(401).json({
        status: "failed",
        message: "You are not authorized to remove members from this group.",
      });
    }

    const memberToRemove = group.participants.find( // eslint-disable-next-line
      (participant) => participant.user.toString() === member
    );

    console.log("memberToRemove", memberToRemove);
    
    if (!memberToRemove) {
      return res.status(404).json({
        status: "failed",
        message: "Member not found.",
      });
    }
    const user = await User.findOne({ _id: memberToRemove.user });

    group.participants = group.participants.filter(
      (participant) => participant._id !== memberToRemove._id
    );

    await group.save();

    io.to(user?.socket_id).emit("group_removed_you", { groupId: group._id });

    res.status(200).json({
      message: "Member removed successfully",
      status: "success",
      memberId: user?._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};

exports.removeMembers = async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    const { membersList } = req.body;

    if (
      !userId ||
      !groupId ||
      !membersList ||
      !Array.isArray(membersList) ||
      membersList.length === 0
    ) {
      return res.status(400).json({
        status: "failed",
        message:
          "Invalid input. Provide userId, groupId, and a valid membersList.",
      });
    }

    const group = await GroupMessage.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: "failed",
        message: "Group not found.",
      });
    }

    const requestingUser = group.participants.find(
      (participant) => participant.user.toString() === userId
    );

    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(401).json({
        status: "failed",
        message: "You are not authorized to remove members from this group.",
      });
    }

    const membersToRemove = membersList.map((memberId) => memberId.toString());
    const initialCount = group.participants.length;
    group.participants = group.participants.filter(
      (participant) => !membersToRemove.includes(participant.user.toString())
    );

    if (initialCount === group.participants.length) {
      return res.status(400).json({
        status: "failed",
        message: "No valid members were found to remove.",
      });
    }

    await group.save();

    res.status(200).json({
      message: "Members removed successfully",
      status: "success",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};

exports.selectedGroupConversation = async (req, res) => {
  try {
    const { search, userid } = req.query;

    // Validate input
    if (!search || search.trim() === "") {
      return res.status(400).json({
        status: "failed",
        message: "Search is required",
      });
    }

    // Find the conversation
    const conversation = await GroupMessage.findOne({
      _id: search,
      "participants.user": userid,
    }).populate(
      "participants.user",
      "firstname lastname _id status socket_id profile"
    );

    if (!conversation) {
      return res.status(404).json({
        status: "failed",
        message: "No Conversation found",
        data: [],
      });
    }

    // Reverse messages for response
    const reversedMessages = conversation.messages
      .map((message) => {
        if (message.status === "delete") {
          return {
            seen: message.seen || "unseen",
            to: message.to,
            from: message.from,
            type: "text",
            created_at: message.created_at,
            text: "This message is deleted",
            _id: message._id,
            status: "delete",
          };
        }
        return message;
      })
      .reverse();

    const reversedConversation = {
      ...conversation.toObject(),
      messages: reversedMessages,
    };

    return res.status(200).json({
      status: "success",
      data: [reversedConversation],
    });
  } catch (error) {
    console.error("Error in selectedConversation:", error);
    return res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};
