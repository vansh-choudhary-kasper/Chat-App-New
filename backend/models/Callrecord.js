const mongoose = require("mongoose");

const CallSchema = new mongoose.Schema(
  {
    participants: [
      {
        user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
        timing: { type: Array, default: [] },
        host: { type: Boolean, default: false },
        callStatus: {
          type: String,
          enum: ["missed", "incoming", "outgoing"],
          default: "outgoing",
        },
      },
    ],
    roomName: { type: String, required: true },
    status: { type: String, enum: ["active", "ended"], default: "active" },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
  },
  { timestamps: true }
);

const CallRecord = mongoose.model("CallRecord", CallSchema);

module.exports = CallRecord;
