const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Roles = new Schema({    
    name: {
        type: String
    },
    index: {
        type: String
    }
},{
    colletion: 'Roles'
});

module.exports = mongoose.model('Roles', Roles);