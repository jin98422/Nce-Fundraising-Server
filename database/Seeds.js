const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Seeds = new Schema({    
    flag: {
        type: Boolean
    }
},{
    colletion: 'Seeds'
});

module.exports = mongoose.model('Seeds', Seeds);