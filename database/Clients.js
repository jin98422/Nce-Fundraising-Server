const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Clients = new Schema({    
    name: {
        type: String
    },
    email: {
        type: String
    },
    profile: {
        type: String
    },
    header: {
        type: String
    },
    color: {
        type: String
    },
    phone: {
        type: String
    },
    contact: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String
    },
    payment: {
        type: String
    },
    key1: {
        type: String
    },
    key2: {
        type: String
    },
    merchantKey: {
        type: String
    },
}, {
    timestamps: true
},{
    colletion: 'Clients'
});

module.exports = mongoose.model('Clients', Clients);