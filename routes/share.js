const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const router =  express.Router();
const { ObjectId } = require('mongodb')

const { TWILIO_SID, TWILIO_TOKEN, DOMAIN, HOST } =  process.env
const sms = require('twilio')(TWILIO_SID, TWILIO_TOKEN);

const Campaign = require('../database/Campaigns');

router.post('/sms', (req, res) => {
    const {number, id} = req.body;
    Campaign.aggregate([
        {
            $match: {
                '_id': ObjectId(id)
            }
        },
        {
            $lookup: {
                from: 'clients',
                localField: 'client',
                foreignField: '_id',
                as: 'client'
            }
        },
    ]).then(doc => {
        console.log(HOST + doc[0].client[0].header)
        let item = doc[0];
        sms. messages.create({
            from: '+14403791173',
            to: number,
            body: item.description + `\n${DOMAIN}/form/${id}`,
            mediaUrl: HOST + item.client[0].header,
        }).then(message => {
            console.log(message)
            res.status(200).json(message)
        }).catch(err => {
            console.log(err)
            res.status(500).json(err)
        })
    }).catch(err => {
        console.log(err)
        res.status(500).json(err)
    })
    
   
});

module.exports = router;

