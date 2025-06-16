const uploadToCloudinary = require("../middleware/cloudinary");
const OneToOneMessage = require("../models/OneToOneMessage");
const GroupMessage = require("../models/GroupMessage");
const User = require("../models/user");
const Group = require("../models/GroupMessage");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { io } = require("../utils/socket");
const upload = require("../middleware/multer");

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

// Make a member an admin
exports.makeAdmin = async (req, res) => {
  try {
    const { groupId, memberId, requesterId } = req.body;

    const group = await GroupMessage.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: "failed",
        message: "Group not found"
      });
    }

    // Check if requester is an admin
    const requester = group.participants.find(p => p.user.toString() === requesterId);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({
        status: "failed",
        message: "Only admins can promote members to admin"
      });
    }

    // Update member's role to admin
    const memberIndex = group.participants.findIndex(p => p.user.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({
        status: "failed",
        message: "Member not found in group"
      });
    }

    group.participants[memberIndex].role = "admin";
    await group.save();

    // Notify group members about new admin
    const newAdminUser = await User.findById(memberId);
    group.participants.forEach(async (participant) => {
      if (participant.status !== 'left') {
        const user = await User.findById(participant.user);
        io.to(user?.socket_id).emit("admin_promoted", {
          groupId,
          newAdmin: {
            _id: newAdminUser._id,
            firstname: newAdminUser.firstname,
            lastname: newAdminUser.lastname
          }
        });
      }
    });

    res.status(200).json({
      status: "success",
      message: "Member promoted to admin successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  }
};

// Handle group creator leaving
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId, userId, newAdminId, assignmentType } = req.body;

    const group = await GroupMessage.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: "failed",
        message: "Group not found"
      });
    }

    const leavingMember = group.participants.find(p => p.user.toString() === userId);
    if (!leavingMember) {
      return res.status(404).json({
        status: "failed",
        message: "Member not found in group"
      });
    }

    let newAdmin;
    // Handle creator leaving
    if (leavingMember.role === "admin") {
      if (assignmentType === "manual" && newAdminId) {
        // Manual assignment to specific member
        newAdmin = group.participants.find(p => p.user.toString() === newAdminId);
        if (!newAdmin || newAdmin.status === "left") {
          return res.status(400).json({
            status: "failed",
            message: "Invalid new admin specified"
          });
        }

        newAdmin.role = "admin";
      } else {
        // Random assignment
        const activeMembers = group.participants.filter(p => 
          p.user.toString() !== userId && 
          p.status !== "left"
        );

        if (activeMembers.length === 0) {
          return res.status(400).json({
            status: "failed",
            message: "Cannot leave group - no active members to transfer ownership to"
          });
        }

        // pick random member
        const selectedMember = activeMembers[Math.floor(Math.random() * activeMembers.length)];
        if(selectedMember) {
          selectedMember.role = "admin";
          newAdmin = selectedMember;
        }
      }

      // // Update leaving creator's status
      // leavingMember.isCreator = false;
    }

    // Update leaving member's status
    leavingMember.status = "left";
    leavingMember.role = "member";
    leavingMember.leftAt.push(new Date(Date.now()));

    const sendMessage = {
      conversation : "group",
      from: userId,
      type: "leftMember",
      created_at: new Date(Date.now() - 1000),
    }
    group.messages.push(sendMessage);

    await group.save();

    // Notify group members
    group.participants.forEach(async (participant) => {
      if (participant.status !== 'left' || participant.user.toString() === userId) {
        const user = await User.findById(participant.user);
        if(newAdmin) {
          console.log("newAdmin => ", newAdmin);
          io.to(user?.socket_id).emit("admin_promoted", {
            groupId,
            newAdmin: {
              _id: newAdmin.user,
              firstname: newAdmin.user.firstname,
              lastname: newAdmin.user.lastname
            }
          });
        }
        io.to(user?.socket_id).emit("group_message", {
          conversation_id : groupId,
          message: sendMessage,
        });
        io.to(user?.socket_id).emit("group_removed_member", {
          groupId,
          member: userId
        });
      }
    });

    res.status(200).json({
      status: "success",
      message: leavingMember.isCreator || leavingMember.role === "admin" ? "Group ownership transferred successfully" : "Left group successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
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

exports.updateProfile = async (req, res) => {
  const { group_name, group_id, user_id} = req.body;
  try{
    if (req.user_id !== user_id) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorised",
      })
    }
    const group = await Group.findOne({ _id: group_id });
    if (!group) {
      return res.status(404).json({
        status: "failed",
        message: "Group not found.",
      });
    }
    const requestingUser = group.participants.find(
      (participant) => participant.user.toString() === user_id
    );
    const RequesterUser = await User.findById(user_id); 
    if (!RequesterUser) {
      return res.status(404).json({
        status: "failed",
        message: "User not found.",
      });
    }
    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(401).json({
        status: "failed",
        message: "You are not authorized to update this group.",
      });
    }

    if(req.file){
      try {
        if(group.group_image){
          const urlParts = group.group_image.split("/");
          const filename = urlParts[urlParts.length - 1];
          const publicId = filename.split(".")[0];

          await cloudinary.uploader.destroy(publicId);
        }

        const cloudinaryRes = await uploadToCloudinary(req.file, "image");
        group.groupProfile = cloudinaryRes.secure_url;
      } catch (error) {
        console.error("Cloudinary Error:", error);
        return res.status(500).json({
          status: "error",
          message: "File upload failed",
        });
      }
    }
    if(group_name){
      group.groupName = group_name;
    }
    await group.save();

    const membersIds = group.participants.map(val => val.user._id);
    const members = await User.find({ _id: { $in: membersIds } });
    const socketIds = members.map(val => val.socket_id);

    io.to(socketIds).emit("group_updated", { data: {
        group_id: group._id,
        group_name: group.groupName,
        group_image: group.groupProfile,
      } });

    res.status(200).json({
      message: "Group updated successfully",
      status: "success",
      data: {
        group_id: group._id,
        group_name: group.groupName,
        group_image: group.groupProfile,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
}

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
    const group = await GroupMessage.findOne({
      _id: groupId,
    }).populate(
      "participants.user",
      "firstname lastname _id status socket_id profile"
    );

    if (!group) {
      return res.status(404).json({
        status: "failed",
        message: "Group not found.",
      });
    }

    const requestingUser = group.participants.find(
      (participant) => participant.user._id.toString() === userId
    );

    const RequesterUser = await User.findById(userId);
    if (!RequesterUser) {
      return res.status(404).json({
        status: "failed",
        message: "User not found.",
      });
    }
    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(401).json({
        status: "failed",
        message: "You are not authorized to add members to this group.",
      });
    }

    const existingMemberIds = group.participants.map((participant, i) => {
      const userIdStr = participant.user._id.toString();
      if (membersList.includes(userIdStr)) {
          group.participants[i].status = "offline";
          group.participants[i].joinedAt.push(new Date(Date.now()));
      }
      return userIdStr;
    });
    const uniqueNewMembers = membersList.filter(
      (memberId) => !existingMemberIds.includes(memberId)
    );

    // if (uniqueNewMembers.length === 0) {
    //   return res.status(400).json({
    //     status: "failed",
    //     message: "All members are already in the group.",
    //   });
    // }

    const participantsToAdd = uniqueNewMembers.map((memberId) => ({
      user: new mongoose.Types.ObjectId(memberId),
      role: "member",
    }));

    const sendMessages = [];
    // without password
    let newMembers = await User.find({ _id: { $in: membersList } }).select('-password');
    newMembers = newMembers.map((user) => {
      console.log(user);
      const sendMessage = {
        conversation : "group",
        from: userId,
        type: "addMember",
        addedMember: user?._id?.toString(),
        created_at: new Date(Date.now() + 1000),
      }
      sendMessages.push(sendMessage);
      group.messages.push(sendMessage);

      return {
        user,
        role: "member",
      };
    });

    const { messages, ...groupWithoutMessages } = group.toObject();

    io.to(newMembers.map(val => val.user.socket_id)).emit("group_added_you", { group : groupWithoutMessages });
    // io.to(group.participants.map(val => val.user.socket_id)).emit("group_added_member", { groupId, newMembers });
    group.participants.forEach(async (val) => {
      if(val.status !== 'left') {
        const emp = await User.findOne({ _id: val.user._id.toString() });
        io.to(emp?.socket_id).emit("group_added_member", { groupId, newMembers : newMembers.filter((member) =>  uniqueNewMembers.includes(member.user?._id.toString())), oldMembers : membersList.filter((member) => !uniqueNewMembers.includes(member)) });
        sendMessages.forEach(async (sendMessage) => {
          io.to(emp?.socket_id).emit("group_message", {
            conversation_id : groupId,
            message: sendMessage,
          });
        })
      }
    });
    newMembers.forEach(async (emp) => {
      sendMessages.forEach(async (sendMessage) => {
        io.to(emp?.socket_id).emit("group_message", {
          conversation_id : groupId,
          message: sendMessage,
        });
      })
    });

    group.participants = group.participants.map((val) => ({
      ...val,
      user: val.user._id,
    }));
    console.log(group.participants);
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

    const RequesterUser = await User.findById(userId);
    if (!RequesterUser) {
      return res.status(404).json({
        status: "failed",
        message: "User not found.",
      });
    }

    const memberToRemove = group.participants.find(
      (participant) => participant.user.toString() === member
    );

    if (!memberToRemove) {
      return res.status(404).json({
        status: "failed",
        message: "Member not found.",
      });
    }

    // Check permissions: Only admins can remove members, but admins cannot remove creator
    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(401).json({
        status: "failed",
        message: "You are not authorized to remove members from this group.",
      });
    }

    // Prevent admins from removing creator (only creator can remove anyone)
    if (memberToRemove.isCreator && memberToRemove.role === "admin") {
      return res.status(403).json({
        status: "failed",
        message: "Cannot remove group creator. Only the creator can remove members.",
      });
    }

    const user = await User.findOne({ _id: memberToRemove.user });

    const sendMessage = {
      conversation : "group",
      from: userId,
      type: "removeMember",
      removedMember: member,
      created_at: new Date(Date.now() - 1000),
    }
    group.messages.push(sendMessage);

    group.participants = group.participants.map(
      (participant) => {
        if(participant._id === memberToRemove._id) {
          participant.status = "left";
          participant.role = "member";
          participant.leftAt.push(new Date(Date.now()));
        }

        return participant;
      } 
    );

    await group.save();

    group.participants.forEach(async (val) => {
      if(val.user.toString() === user._id.toString() || val.status !== 'left') {
        const emp = await User.findOne({ _id: val.user.toString() });
        io.to(emp?.socket_id).emit("group_removed_member", { groupId: group._id, member });
        io.to(emp?.socket_id).emit("group_message", {
          conversation_id : groupId,
          message: sendMessage,
        });
      }
    });
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

function BSfirstMsg(array, joinedAt, leftAt) {
  if(array.length == 0) return {
    startingPoint : -1,
    endingPoint : -1
  };
  let first = 0;
  let last = array.length - 1;
  console.log("length => ", last);
  console.log("joinedAt => ", joinedAt);
  console.log("lastMessage => ", array[last].created_at);
  while (first <= last) {
    const mid = Math.floor((first + last) / 2);
    if (joinedAt > array[mid].created_at) {
      first = mid + 1;
    } else {
      last = mid - 1;
    }
  }

  let obj = {
    startingPoint : first
  }

  first = 0;
  last = array.length - 1;
  while (first <= last) {
    const mid = Math.floor((first + last) / 2);
    if (leftAt > array[mid].created_at) {
      first = mid + 1;
    } else {
      last = mid - 1;
    }
  }

  obj.endingPoint = first;

  return obj;
}

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

    const AccessMsgs = [];
    const user = conversation.participants.find((per) => per?.user?._id.toString() === userid);
    user?.joinedAt.map((date, i) => {
      const limitedMsgs = BSfirstMsg(conversation.messages, date, user.leftAt[i] ? user.leftAt[i] : Date.now());
      console.log(limitedMsgs);
      for(let i = limitedMsgs.startingPoint; i < conversation.messages.length && i < limitedMsgs.endingPoint; i++) {
        let message = conversation.messages[i];
        if (message.status === "delete") {
          AccessMsgs.push({
            seen: message.seen || "unseen",
            to: message.to,
            from: message.from,
            type: "text",
            created_at: message.created_at,
            text: "This message is deleted",
            _id: message._id,
            status: "delete",
          });
        } else {
          AccessMsgs.push(message);
        }
      }
    })

    // Reverse messages for response
    const reversedMessages = AccessMsgs.reverse();

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

// Remove admin privileges from a member
exports.removeAdmin = async (req, res) => {
  try {
    const { groupId, memberId, requesterId } = req.body;

    const group = await GroupMessage.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: "failed",
        message: "Group not found"
      });
    }

    // Find requester and target member
    const requester = group.participants.find(p => p.user.toString() === requesterId);
    const targetMember = group.participants.find(p => p.user.toString() === memberId);

    if (!requester || !targetMember) {
      return res.status(404).json({
        status: "failed",
        message: "User not found in group"
      });
    }

    // Check permissions: only admin can remove admin privileges
    if (requester.role !== "admin") {
      return res.status(403).json({
        status: "failed",
        message: "Insufficient permissions"
      });
    }

    // Allow removing admin privileges from creator as well, so remove this check
    if (targetMember.isCreator && targetMember.role === "admin") {
      return res.status(403).json({
        status: "failed",
        message: "Admin cannot modify creator's role"
      });
    }

    // Cannot remove admin privileges from non-admin
    if (targetMember.role !== "admin") {
      return res.status(400).json({
        status: "failed",
        message: "User is not an admin"
      });
    }

    // Update the member's role to "member"
    targetMember.role = "member";
    await group.save();

    // Notify group members about admin removal
    const demotedUser = await User.findById(memberId);
    group.participants.forEach(async (participant) => {
      if (participant.status !== 'left') {
        const user = await User.findById(participant.user);
        io.to(user?.socket_id).emit("admin_removed", {
          groupId,
          demotedAdmin: {
            _id: demotedUser._id,
            firstname: demotedUser.firstname,
            lastname: demotedUser.lastname
          }
        });
      }
    });

    res.status(200).json({
      status: "success",
      message: "Admin privileges removed successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  }
};
