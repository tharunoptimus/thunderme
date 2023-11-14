const mongoose = require("mongoose")
require('dotenv').config()
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const MONGO_URI = process.env.MONGO_URI;

class Database {

    constructor() {
        this.connect();
    }

    connect() {
        mongoose.connect(MONGO_URI)
        .then(() => {
            console.log("Database Connection Successful!");
        })
        .catch((err) => {
            console.log("Database Connection Failed!" + err);
        })
    }
}

module.exports = new Database();
