const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Campaigns = new Schema({    
    name: {
        type: String
    },
    source: {
        type: Schema.ObjectId
    },
    client: {
        type: Schema.ObjectId
    },
    contact: {
        type: String
    },
    lead: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String,
    },
    team: {
        type: Schema.ObjectId,
    }
}, {
    timestamps: true
},{
    colletion: 'Campaigns'
});

module.exports = mongoose.model('Campaigns', Campaigns);