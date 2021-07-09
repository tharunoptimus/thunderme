const express = require("express");
const app = express();
const router = express.Router();
const bcrypt = require("bcrypt");
const path = require("path");
const User = require("../schemas/UserSchema");

app.use(express.urlencoded({extended: true}));
app.use(express.json())

router.get("/images/:path", (req, res, next) => {
    res.sendFile(path.join(__dirname, "../uploads/images/" + req.params.path));
})


module.exports = router;