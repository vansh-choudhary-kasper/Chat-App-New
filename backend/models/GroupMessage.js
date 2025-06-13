const mongoose = require("mongoose");

const GroupMessageSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
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
        isCreator: {
          type: Boolean,
          default: false,
        },
        status: {
          type: String,
          enum: ["online", "offline", "left"],
          default: "offline",
        },
        joinedAt: {
          type: [Date],
          default: () => [Date.now()],
        },
        leftAt: [
          {
            type: Date,
            default: Date.now,
          }
        ]
      },
    ],
    // removed: [
    //   {
    //     people: {
    //       type: mongoose.Schema.ObjectId,
    //       ref: "User",
    //     },
    //     joinedAt: {
    //       type: Date,
    //     },
    //     leftAt: {
    //       type: Date,
    //       default: Date.now,
    //     },
    //   },
    // ],
    messages: [
      {
        from: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        type: {
          type: String,
          enum: ["text", "video", "image", "pdf", "zip", "link", "date", "addMember", "removeMember"],
        },
        removedMember: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        addedMember: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
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
          type: new mongoose.Schema({
            type: { type: String },
            filename: { type: String },
            text: { type: String },
            _id: { type: String }
          }, { _id: false })
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