const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Donors = new Schema({ 
    fname: {
        type: String
    },
    lname: {
        type: String
    },
    street1: {
        type: String
    },
    street2: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    zip: {
        type: String
    },
    country: {
        type: String
    },
    campaign: {
        type: Schema.ObjectId,
    },
    source: {
        type: Schema.ObjectId,
    },
    charity: {
        type: Schema.ObjectId
    },
    team: {
        type: Schema.ObjectId
    },
    age: {
        type: Number
    },
    gender: {
        type: String
    },
    phone: {
        type: String
    },
    email: {
        type: String
    },
    recurring: {
        type: Boolean,
    },
    frequency: {
        type: String,
        default: '',
    },
    cardNum: {
        type: String,
        default: ''
    },
    expMon: {
        type: String,
        default: '',
    },
    expYear: {
        type: String,
        default: ''
    },
    amount: {
        type: String,
        default: '',
    },
    cvv: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        default: ''
    },
    curreny: {
        type: String,
        default: '',
    },
}, {
    timestamps: true
},{
    colletion: 'Donors'
});

module.exports = mongoose.model('Donors', Donors);