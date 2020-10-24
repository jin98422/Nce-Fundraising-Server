const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Genders = new Schema({    
    name: {
        type: String
    },
    index: {
        type: String
    }
},{
    colletion: 'Genders'
});

module.exports = mongoose.model('Genders', Genders);