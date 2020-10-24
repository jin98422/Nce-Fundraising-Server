const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Users = new Schema({
    username: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String,
        default: "",
    },
    role: {
        type: String,
    },
    token: {
        type: String,
        default: "",
    },
    active: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
},{
    colletion: 'Users'
});

module.exports = mongoose.model('Users', Users);