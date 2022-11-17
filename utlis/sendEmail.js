const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Token = require("../models/tokenModel");

module.exports = async (user, mailType, admin) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const encryptedToken = bcrypt
      .hashSync(user._id.toString(), 10)
      .replaceAll("/", "");
    const token = new Token({
      userid: user._id,
      token: encryptedToken,
    });
    await token.save();
    let mailOptions, emailContent;
    if (mailType === "afterreset") {
      emailContent = `<div>
        <h1>Hello ${user.name}</h1>
         <p> Password Reset successfull</p>
          <p> If it's not you , Contact Admin</p>
          <p> Admin Details </p>
          <p>Name : ${admin.name} </p>
          <p>E-mail ${admin.email} </p>
        </div>`;

      mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Password Reset Successfull",
        html: emailContent,
      };
    } else if (mailType === "message") {
      emailContent = `<div>
      <h2> Details of the user/viewer </h2>
        <h3>Name : ${user.name}</h3>
          <h3>E-mail : ${user.email} </h3>
          <h3>Phone Number : ${user.phoneNumber} </h3>
          <h3>Message : ${user.message} </h3>
        </div>`;

      mailOptions = {
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        subject: "Message from Website(get-in-touch)",
        html: emailContent,
      };
    } else {
      emailContent = `<div><h1>Please click on the below link to reset your password</h1> <a href="https://effulgent-donut-d412c4.netlify.app/resetpassword/${encryptedToken}">${encryptedToken}</a> </div>`;

      mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Reset Password",
        html: emailContent,
      };
    }

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};
