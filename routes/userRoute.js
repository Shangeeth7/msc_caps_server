const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const MessageUs = require("../models/sendUsMessageModel");
const Token = require("../models/tokenModel");
const sendEmail = require("../utlis/sendEmail");
const sendVerify = require("../utlis/sendVerifyEmail");
const Mechanic = require("../models/mechanicModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const Appointment = require("../models/appointmentModel");
const moment = require("moment");

router.post("/register", async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newuser = new User(req.body);
    const result = await newuser.save();
    await sendVerify(result, "verifyemail");
    res
      .status(200)
      .send({ message: "User created successfully", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error creating user", success: false, error });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    }
    if (user.isVerified === false) {
      return res
        .status(200)
        .send({ message: "User not Verified", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Invalid Credentials", success: false });
    } else {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res
        .status(200)
        .send({ message: "Login successful", success: true, data: token });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error logging in", success: false, error });
  }
});

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting user info", success: false, error });
  }
});

router.post("/apply-mechanic-account", authMiddleware, async (req, res) => {
  try {
    const newmechanic = new Mechanic({ ...req.body, status: "pending" });
    await newmechanic.save();
    const adminUser = await User.findOne({ isAdmin: true });

    const unseenNotifications = adminUser.unseenNotifications;
    unseenNotifications.push({
      type: "new-mechanic-request",
      message: `${newmechanic.firstName} ${newmechanic.lastName} has applied for a Mechanic account`,
      data: {
        mechanicId: newmechanic._id,
        name: newmechanic.firstName + " " + newmechanic.lastName,
      },
      onClickPath: "/admin/mechaniclist",
    });
    await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });
    res.status(200).send({
      success: true,
      message: "Mechanic account applied successfully",
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
  "/mark-all-notifications-as-seen",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.body.userId });
      const unseenNotifications = user.unseenNotifications;
      const seenNotifications = user.seenNotifications;
      seenNotifications.push(...unseenNotifications);
      user.unseenNotifications = [];
      user.seenNotifications = seenNotifications;
      const updatedUser = await user.save();
      updatedUser.password = undefined;
      res.status(200).send({
        success: true,
        message: "All notifications marked as seen",
        data: updatedUser,
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

router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.seenNotifications = [];
    user.unseenNotifications = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications cleared",
      data: updatedUser,
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

router.get("/get-all-approved-mechanics", authMiddleware, async (req, res) => {
  try {
    const mechanics = await Mechanic.find({ status: "approved" });
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

router.post("/book-appointment", authMiddleware, async (req, res) => {
  try {
    req.body.status = "pending";
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    req.body.time = moment(req.body.time, "HH:mm").toISOString();
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();

    const user = await User.findOne({ _id: req.body.mechanicInfo.userId });
    user.unseenNotifications.push({
      type: "new-appointment-request",
      message: `A new appointment request has been made by ${req.body.userInfo.name}`,
      onClickPath: "/mechanic/appointments",
    });
    await user.save();
    res.status(200).send({
      message: "Appointment booked successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

router.post("/check-booking-avilability", authMiddleware, async (req, res) => {
  try {
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const fromTime = moment(req.body.time, "HH:mm")
      .subtract(1, "hours")
      .toISOString();
    const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toISOString();
    const mechanicId = req.body.mechanicId;
    const appointments = await Appointment.find({
      mechanicId,
      date,
      time: { $gte: fromTime, $lte: toTime },
    });
    if (appointments.length > 0) {
      return res.status(200).send({
        message: "Appointments not available",
        success: false,
      });
    } else {
      return res.status(200).send({
        message: "Appointments available",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.body.userId });
    res.status(200).send({
      message: "Appointments fetched successfully",
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error fetching appointments",
      success: false,
      error,
    });
  }
});
router.post("/send-password-reset-link", async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      const result = await User.findOne({ email: req.body.email });
      await sendEmail(result, "resetpassword");
      res.send({
        success: true,
        message: "Password reset link sent to your email successfully",
      });
    } else {
      return res
        .status(404)
        .send({ message: "Invalid crediatials", success: false });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/resetpassword", async (req, res) => {
  try {
    const tokenData = await Token.findOne({ token: req.body.token });
    if (tokenData) {
      const password = req.body.password;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await User.findByIdAndUpdate(tokenData.userid, {
        password: hashedPassword,
      });
      res.send({ success: true, message: "Password reset successfull" });
      const data = tokenData.userid;
      const admin = await User.findOne({ isAdmin: true });
      const result = await User.findById(data);
      await sendEmail(result, "afterreset", admin);
      const idData = tokenData.userid;
      await Token.findOneAndDelete({ _id: tokenData._id }, { userid: idData });
    } else {
      res.send({ success: false, message: "Invalid token" });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/verifyemail", async (req, res) => {
  try {
    const tokenData = await Token.findOne({ token: req.body.token });
    if (tokenData) {
      await User.findByIdAndUpdate(tokenData.userid, { isVerified: true });
      // await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });

      const data = tokenData.userid;
      console.log("Data : ", data);
      const data2 = req.body.token;
      console.log("Data2 : ", data2);
      await Token.findOneAndDelete({ token: req.body.token });
      res.send({ success: true, message: "Email Verified Successlly" });
      const result = await User.findById(data);
      await sendVerify(result, "afterverify");
    } else {
      res.send({ success: false, message: "Invalid token" });
      console.log(error);
    }
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});

router.post("/message", async (req, res) => {
  try {
    const newuser = new MessageUs(req.body);
    const result = await newuser.save();
    await sendEmail(result, "message");
    res.status(200).send({ message: "Message Sent", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Unable to send message", success: false, error });
  }
});
module.exports = router;
