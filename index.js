require("dotenv").config();
const express = require("express");
const path = require("path");
const router = require("./router/url");

require("./connection");

const app = express();
const PORT = process.env.PORT || 3000;

const BASE_URL = process.env.BASE_URL;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.get("/", (req, res) => {
  res.render("home", { baseUrl: BASE_URL });
});

app.use("/", router);

app.listen(PORT, () => {
  console.log(`Server running on ${BASE_URL}`);
});
