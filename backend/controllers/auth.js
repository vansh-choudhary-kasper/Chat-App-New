const uploadToCloudinary = require("../middleware/cloudinary");
const User = require("../models/user");
const filterObj = require("../utils/filterObj");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const SendMails = require("../middleware/sendMails");
const signToken = ({ userId, access }) => {
  return jwt.sign({ userId, access }, process.env.JWT_SECRET);
};
exports.register = async (req, res) => {
  const { email } = req.body;
  console.log(req.body);

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({
        status: "error",
        message: "Email is already in use",
      });
      return;
    } else {
      const { password, confirmPassword } = req.body;

      let profileImageUrl = null;
      if (password !== confirmPassword) {
        res.status(400).json({
          status: "error",
          message: "Passwords do not match",
        });
        return;
      }
      if (req.file) {
        try {
          const cloudinaryRes = await uploadToCloudinary(
            req.file.path,
            "image"
          ); // Pass the file path and type
          profileImageUrl = cloudinaryRes.secure_url; // Get the URL of the uploaded image
        } catch (error) {
          return res.status(500).json({
            status: "error",
            message: "File upload failed",
          });
        }
      }
      const filtereobj = filterObj(
        req.body,
        "firstname",
        "lastname",
        "email",
        "password"
      );
      if (profileImageUrl) {
        filtereobj.profile = profileImageUrl;
      }
      const newUser = new User(filtereobj);
      const user = await newUser.save();

      res.status(200).json({
        status: "success",
        data: user,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "server error",
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      res.status(400).json({
        status: "error",
        message: "both email and password are required",
      });
    }

    const userDoc = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    //  if(userDoc.socket_id!=="logout"){
    //     res.status(409).json({
    //         status: "error",
    //         message: "already logged in"
    //     })
    //     return;
    //  }
    if (
      !userDoc ||
      !(await userDoc.correctPassword(password, userDoc.password))
    ) {
      res.status(400).json({
        status: "error",
        message: "Email or password is incorrect",
      });
      return;
    }

    const token = signToken({
      userId: userDoc._id.toString(),
      access: userDoc.access,
    });

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      data: { token, userId: userDoc._id, access: userDoc.access },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "server error",
    });
  }
};
exports.logout = async (req, res) => {
  const { user } = req.query;

  try {
    if (!user) {
      res.status(400).json({
        status: "error",
        message: "user is required",
      });
    }

    const userDoc = await User.findByIdAndUpdate(
      { _id: user },
      { $set: { status: "Offline" } }
    );

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "server error",
    });
  }
};

exports.sendOtp = async (req, res) => {
  const { user_mail } = req.query;

  try {
    if (!user_mail) {
      res.status(400).json({
        message: "user id is required",
        status: "fail",
      });
      return;
    }

    const user = await User.findOne({ email: user_mail });

    if (!user) {
      res.status(404).json({
        status: "failed",
        message: "No user found",
      });
      return;
    }
    const otp = Math.floor(Math.random() * 9000) + 1000;
    const otp_expiry_time = Date.now() + 10 * 60 * 1000;
    user.otp = otp;
    user.otp_expiry_time = otp_expiry_time;
    await user.save({ new: true, validateModifiedOnly: true });
    SendMails(otp.toString(), user.email, `${user.firstname} ${user.lastname}`);
    res.status(200).json({
      status: "success",
      message: "OTP sent susccessfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "error",
    });
  }
};

exports.verifyOTP = async (req, res, next) => {
  const { email, verificationCode, password, confirmPassword } = req.body;

  const user = await User.findOne({
    email,
    otp_expiry_time: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Email is Invalid or OTP expired",
    });
  }

  if (!(await user.correctOTP(verificationCode, user.otp))) {
    return res.status(400).json({
      status: "error",
      message: "OTP is incorrect",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      status: "error",
      message: "Password and Confirm Password do not match",
    });
  }

  user.password = password;
  user.passwordConfirm = password;

  user.otp = undefined;

  await user.save({ new: true, validateModifiedOnly: true });

  const token = signToken({ userId: user._id, access: user.access });

  return res.status(200).json({
    status: "success",
    message: "OTP verified and password changed successfully",
    token, // Optionally include the token in the response
  });
};

exports.profileUpdate = async (req, res) => {
  const { user_id, about } = req.body;
  console.log(user_id, req.user_id);
  try {
    if (req.user_id !== user_id) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorised",
      });
    }
    const existingUser = await User.findById(user_id);

    if (!existingUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    let profileImageUrl = existingUser.profile;

    if (req.file) {
      try {
        if (existingUser.profile) {
          const urlParts = existingUser.profile.split("/");
          const filename = urlParts[urlParts.length - 1];
          const publicId = filename.split(".")[0];

          await cloudinary.uploader.destroy(publicId);
        }

        const cloudinaryRes = await uploadToCloudinary(req.file.path, "image");
        profileImageUrl = cloudinaryRes.secure_url;
      } catch (error) {
        console.error("Cloudinary Error:", error);
        return res.status(500).json({
          status: "error",
          message: "File upload failed",
        });
      }
    }

    existingUser.profile = profileImageUrl;
    if (about) {
      existingUser.about = about;
    }

    await existingUser.save();

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        profile: existingUser.profile,
        about: existingUser.about,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
