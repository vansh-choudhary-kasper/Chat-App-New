const mongoose = require("mongoose");

const GroupMessageSchema = new mongoose.Schema(
  {
    participants: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "member"],
          default: "member",
        },
      },
    ],
    removed: [
      {
        people: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        date: {
          type: Date,
        },
      },
    ],
    messages: [
      {
        from: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        type: {
          type: String,
          enum: ["text", "video", "image", "pdf", "zip", "link","date"],
        },
        file: {
          type: String,
        },
        filename: {
          type: String,
        },
        created_at: {
          type: Date,
          default: Date.now,
        },
        text: {
          type: String,
        },
        preview: {
          type: String,
        },
        reply: {
          type: String,
        },
        replyType: {
          type: String,
          enum: ["text", "video", "image", "pdf", "zip", "link"],
        },
        seen: {
          type: String,
          default: "unseen",
        },
        status: {
          type: String,
          default: "msg",
          enum: ["msg", "delete"],
        },
      },
    ],
    groupName: { type: String, required: true },
    groupstatus: { type: String, default: "group", enum: ["group", "pinned"] },
    groupProfile: { type: String },
  },
  {
    timestamps: true,
  }
);


const GroupMessage = mongoose.model("GroupMessage", GroupMessageSchema);

module.exports = GroupMessage;