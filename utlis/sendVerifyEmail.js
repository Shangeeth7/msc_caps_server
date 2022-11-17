const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Token = require("../models/tokenModel");

module.exports = async (user, mailType) => {
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
    if (mailType === "verifyemail") {
      emailContent = `<div><h1>Please click on the below link to verify your email address</h1> <a href="http://localhost:3000/verifyemail/${encryptedToken}">${encryptedToken}</a>  </div>`;

      mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Verify Email | MSC Login",
        html: emailContent,
      };
    } else {
      emailContent = `<div><h2>Hello ${user.name}</h2>
      <p> Welcome to Motorcycle Servicing Company
      </p>
      </div>`;

      mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Welcome to MSC | A Motorcycle Servicing Company",
        html: emailContent,
      };
    }

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};
