const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

require("dotenv").config();
const dbConfig = require("./config/dbConfig");
app.use(express.json());
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const mechanicRoute = require("./routes/mechanicsRoute");
const path = require("path");

app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/mechanic", mechanicRoute);

const port = process.env.PORT || 9043;

app.get("/", (req, res) =>
  res.send(` 
<div style="padding-left:20px;height:100vh;max-width:200vh;background-image: url('https://silodrome.com/wp-content/uploads/2014/08/Honda-Custom-Motorcycle-3.jpg');background-repeat: no-repeat; ">
<div style="padding-top:50px;">
<h2 style="color:white;">Hey it's the Backend Server for <span style="color:orange;" >Motorcycle Serviving Company | MSC .</span> <h2>   <br />
<a href="https://motorcycle-servicing-company.netlify.app" style="color:white;"> Click here for <span style="color:orange;padding-left:5px;" >  MSC - Frontend.</span> </a>
</div>
</div>

`)
);
app.listen(port, () => console.log(`Node Express Server Started at ${port}!`));
