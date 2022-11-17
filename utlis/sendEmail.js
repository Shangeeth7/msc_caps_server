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
      <h2 style="color:orange;" >MSC <span style="color:grey;" > | Motorcycle Servicing Company .</span> <h2> 
      
      <h2 style="color:grey;font-size:15px;">Hello <span style="color:orange;font-size:17px;">${user.name}</span></h2>

         <h4 style="color:grey;font-size:20px;" > Password Reset successfull</h4>
          <p style="color:red;font-size:15px;"> If it's not you , Contact Admin</p>
          <p style="color:grey;font-size:15px;"> Admin Details : </p>
          <p style="color:grey;font-size:15px;">Name : <span style="color:orange;font-size:16px;" > ${admin.name}</span> </p>
          <p style="color:grey;font-size:15px;">E-mail <span style="color:orange;font-size:16px;" > ${admin.email} </span></p>
          <br />
          
          <br />
          <br />
          <br />
          <br />
         
          <span style="color:grey;font-size:10px;" > © Copyright 2022 - Motorycle Servicing Company All Rights Reserved.</span>
          </div>`;

      mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Password Reset Successfull",
        html: emailContent,
      };
    } else if (mailType === "message") {
      emailContent = `<div>
      <h2 style="color:orange;" >MSC <span style="color:grey;" > | Motorcycle Servicing Company .</span> <h2> 
      <br />
      <h2 style="color:grey;"> Details of the user/viewer </h2>
        <h3 style="color:grey;font-size:15px;">Name :  <span style="color:orange;font-size:16px;" >${user.name}</span> </h3>
          <h3 style="color:grey;font-size:15px;">E-mail :  <span style="color:orange;font-size:16px;" >${user.email} </span> </h3>
          <h3 style="color:grey;font-size:15px;">Phone Number :  <span style="color:orange;font-size:16px;" >${user.phoneNumber}</span>  </h3>
          <h3 style="color:grey;font-size:15px;">Message :  <span style="color:orange;font-size:16px;" >${user.message} </span> </h3>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
         
          <span style="color:grey;font-size:10px;" > © Copyright 2022 - Motorycle Servicing Company All Rights Reserved.</span>
          </div>`;

      mailOptions = {
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        subject: "Message from Website(get-in-touch)",
        html: emailContent,
      };
    } else {
      emailContent = `<div>
      <h2 style="color:orange;" >MSC <span style="color:grey;" > | Motorcycle Servicing Company .</span> <h2> 
      <br />
      <a  href="https://effulgent-donut-d412c4.netlify.app/resetpassword/${encryptedToken}"><span style="color:grey;font-size:15px;" >Click here to Reset Password</span></a> 
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
     
      <span style="color:grey;font-size:10px;" > © Copyright 2022 - Motorycle Servicing Company All Rights Reserved.</span>
      </div>`;

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
