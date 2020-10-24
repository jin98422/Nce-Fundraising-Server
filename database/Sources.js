const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Sources = new Schema({    
    client: {
        type: Schema.ObjectId
    },
    method: {
        type: String
    },
    status: {
        type: String
    },
    street1: {
        type: String,
        default: "",
    },
    street2: {
        type: String,
        default: "",
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    zip: {
        type: String,
        default: "",
    },
    id: {
        type: String
    },
    status: {
        type: String,
    }
}, {
    timestamps: true
},{
    colletion: 'Sources'
});

module.exports = mongoose.model('Sources', Sources);