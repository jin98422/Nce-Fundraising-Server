const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Teams = new Schema({    
    leader: {
        type: String
    },
    name: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    type: {
        type: String
    },
    fundraisersIds: {
        type: Array
    },
    status: {
        type: String,
    }
}, {
    timestamps: true
},{
    colletion: 'Teams'
});

module.exports = mongoose.model('Teams', Teams);