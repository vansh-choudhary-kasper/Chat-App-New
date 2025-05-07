const uploadToCloudinary = require("../middleware/cloudinary");
const User = require("../models/user");

exports.users = async (req, res) => {
  try {
    const { search, user } = req.query;

    if (!search || search.trim() === "") {
      res.status(400).json({
        status: "failed",
        message: "Search is required",
      });
      return;
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { firstname: { $regex: search, $options: "i" } },
            { lastname: { $regex: search, $options: "i" } },
          ],
        },
        { _id: { $ne: user } },
      ],
    })
      .select("firstname lastname status profile _id")
      .limit(5);

    if (users.length === 0) {
      res.status(404).json({
        status: "failed",
        message: "No user found",
      });
      return;
    }
    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
exports.user = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim() === "") {
      res.status(400).json({
        status: "failed",
        message: "Search is required",
      });
      return;
    }

    const user = await User.findById({
      _id: search,
    }).select("firstname lastname status profile _id access about");

    if (user.length === 0) {
      res.status(404).json({
        status: "failed",
        message: "No user found",
      });
      return;
    }
    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
exports.verify = async (req, res) => {
  try {
    const { user } = req.query;

    if (!user || user.trim() === "") {
      res.status(400).json({
        status: "failed",
        message: "user is required",
      });
      return;
    }

    const userId = await User.findById(user);

    res.status(200).json({
      status: "success",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
