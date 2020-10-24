const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Methods = new Schema({    
    name: {
        type: String
    },
    index: {
        type: String
    }
},{
    colletion: 'Methods'
});

module.exports = mongoose.model('Methods', Methods);