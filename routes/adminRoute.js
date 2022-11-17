const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Mechanic = require("../models/mechanicModel");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/get-all-mechanics", authMiddleware, async (req, res) => {
  try {
    const mechanics = await Mechanic.find({});
    res.status(200).send({
      message: "Mechanics fetched successfully",
      success: true,
      data: mechanics,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying Mechanic account",
      success: false,
      error,
    });
  }
});

router.get("/get-all-users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).send({
      message: "Users fetched successfully",
      success: true,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying Mechanic account",
      success: false,
      error,
    });
  }
});

router.post(
  "/change-mechanic-account-status",
  authMiddleware,
  async (req, res) => {
    try {
      const { mechanicId, status } = req.body;
      const mechanic = await Mechanic.findByIdAndUpdate(mechanicId, {
        status,
      });

      const user = await User.findOne({ _id: mechanic.userId });
      const unseenNotifications = user.unseenNotifications;
      unseenNotifications.push({
        type: "new-mechanic-request-changed",
        message: `Your Mechanic account has been ${status}`,
        onClickPath: "/notifications",
      });
      user.isMechanic = status === "approved" ? true : false;
      await user.save();

      res.status(200).send({
        message: "Mechanic status updated successfully",
        success: true,
        data: mechanic,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error applying Mechanic account",
        success: false,
        error,
      });
    }
  }
);

module.exports = router;
