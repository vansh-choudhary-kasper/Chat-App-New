const mongoose = require("mongoose");

const OneToOneMessageSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        to: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        from: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        type: {
          type: String,
          enum: ["text", "video", "image", "pdf", "zip", "link", "date"],
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
          type: Array,
        },
        status: {
          type: String,
          default: "msg",
          enum: ["msg", "delete"],
        },
      },
    ],
    status: { type: [String] },
  },
  {
    timestamps: true,
  }
);

const OneToOneMessage = mongoose.model(
  "OneToOneMessage",
  OneToOneMessageSchema
);

module.exports = OneToOneMessage;
