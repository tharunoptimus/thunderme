const mongoose = require("mongoose")
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);


class Database {

    constructor() {
        this.connect();
    }

    connect() {
        mongoose.connect("mongodb+srv://username:password@commit.fddsp.mongodb.net/CommitDB?retryWrites=true&w=majority")
        .then(() => {
            console.log("Database Connection Successful!");
        })
        .catch((err) => {
            console.log("Database Connection Failed!" + err);
        })
    }
}

module.exports = new Database();