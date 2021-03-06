const express = require("express");
const app = express();
const router = express.Router();
const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");
const Chat = require("../../schemas/ChatSchema");
const Message = require("../../schemas/MessageSchema");
const Notification = require("../../schemas/NotificationSchema");


app.use(express.urlencoded({extended: true}));
app.use(express.json())


router.post("/", async (req, res, next) => {
    if(!req.body.content || !req.body.chatId) {
        console.log("Invalid data passed to the request");
        return res.sendStatus(400);
    }

    var newMessage = {
        sender: req.session.user._id,
        content: req.body.content,
        chat: req.body.chatId
    }

    await Message.create(newMessage)
    .then( async message => {
        message = await message.populate("sender").execPopulate();
        message = await message.populate("chat").execPopulate();
        message = await User.populate(message, { path: "chat.users" });

        var chat = await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message })
        .catch(error => console.log(error))

        insertNotifications(chat, message);

        res.status(201).send(message);
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
    
})

router.put("/delete/:messageId", async (req, res, next) => {
    var messageId = req.params.messageId;

    var messageToDelete = await Message.findById(messageId)

    if(messageToDelete.sender._id != req.session.user._id) {
        return res.sendStatus(401);
    }
    else {
        await Message.findByIdAndRemove(messageId)
        .then( async message => { res.sendStatus(204); })
        .catch(error => console.log(error))
    }
    
})

function insertNotifications(chat, message) {
    chat.users.forEach(userId => {
        if(userId == message.sender._id.toString()) return;
        Notification.insertNotification(userId, message.sender._id, "newMessage", message.chat._id)
    });
}


module.exports = router;