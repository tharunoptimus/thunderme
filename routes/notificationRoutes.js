const express = require("express");
const mongoose = require("mongoose");
const app = express();
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../schemas/UserSchema");
const Chat = require("../schemas/ChatSchema");

app.use(express.urlencoded({extended: true}));
app.use(express.json())

router.get("/", (req, res, next) => {
    res.status(200).render("notificationsPage", {
        pageTitle: "Notifications",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    });
})

module.exports = router;