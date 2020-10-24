const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Fundraisers = new Schema({    
    name: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String,
        default: '',
    },
    phone: {
        type: String
    },
    contact: {
        type: String
    },
    status: {
        type: String
    },
    photo: {
        type: String
    },
    token: {
        type: String,
        default: ''
    },
    active: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
},{
    colletion: 'Fundraisers'
});

module.exports = mongoose.model('Fundraisers', Fundraisers);