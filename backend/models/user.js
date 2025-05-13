const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      require: [true, "Email is required"],
      validate: {
        validator: function (email) {
          return String(email)
            .toLowerCase()
            .match(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
        },
        message: (props) => {
          `Email ${props.value} is invalid`;
        },
      },
    },
    about: {
      type: String,
      default: "Here for good vibes and great chats!",
    },
    lastname: { type: String, require: [true, "lastname is required"] },
    firstname: { type: String, require: [true, "firstname is required"] },
    password: { type: String, require: [true, "Password is required"] },
    passwordConfirm: { type: String },
    access: { type: String, enum: ["user", "admin"], default: "user" },
    otp: { type: String },
    otp_expiry_time: { type: Date },
    friends: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["Online", "Offline"],
      default: "Offline",
    },
    socket_id: {
      type: String,
      default: "logout",
    },
    inCall: {
      type: Boolean,
      default: false,
    },
    profile: { type: String },
    activeToken: { type: String },
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("otp") || !this.otp) return next();

  this.otp = await bcrypt.hash(this.otp.toString(), 12);
  next();
});
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.correctOTP = async function (candidateOTP, userOTP) {
  return await bcrypt.compare(candidateOTP, userOTP);
};
const User = new mongoose.model("User", userSchema);

module.exports = User;
