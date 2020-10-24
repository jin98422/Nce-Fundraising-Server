const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const router =  express.Router();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const Campaign = require('../database/Campaigns');
const Fundraiser = require('../database/Fundraisers');
 
router.get('/', (req, res) => {
    const {id} = req.query
    if(id) {
        Campaign.find({_id: id}).then(doc => {
            res.status(200).json(doc)
        }).catch(err => {
            res.status(500).json(err)
        })
    } else {
        Campaign.aggregate([
            {
                $lookup: {
                    from: 'clients',
                    localField: 'client',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'team',
                    foreignField: '_id',
                    as: 'fundraisers'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'team',
                    foreignField: '_id',
                    as: 'leader'
                }
            },
            {
                $lookup: {
                    from: 'sources',
                    localField: 'source',
                    foreignField: '_id',
                    as: 'source'
                }
            },
            {
                $lookup: {
                    from: 'donors',
                    localField: '_id',
                    foreignField: 'campaign',
                    as: 'donor'
                }
            }
        ]).then(doc => {            
            for(let i = 0; i < doc.length; i++) {
                let item =  doc[i];
                if(item.client.length != 0) doc[i].client = item.client[0].name;
                if(item.leader.length != 0) doc[i].leader = item.leader[0].leader;
                if(item.source.length != 0) doc[i].source = item.source[0].id;
                if(item.fundraisers.length != 0){ 
                    doc[i].fundraisers = item.fundraisers[0].fundraisersIds.length;
                } else {
                    doc[i].fundraisers = item.fundraisers.length;
                }
                if(item.donor.length != 0){
                    let changeDonor = [];
                    for(let j=0; j<item.donor.length; j++) {
                        let date = new Date(item.donor[j].createdAt).toString().split(" ");
                        let flag = false;
                        
                        for(let k=0; k<changeDonor.length; k++) {                            
                            if(changeDonor[k].year == date[3] && changeDonor[k].month == date[1]) {
                                changeDonor[k].amount += parseInt(item.donor[j].amount);
                                flag =  true;
                            }
                        }
                        if(!flag) {
                            changeDonor.push({
                                year: date[3],
                                month: date[1],
                                amount: parseInt(item.donor[j].amount)
                            })
                        }
                        
                    }
                    doc[i].donor = changeDonor;
                }
            }
            res.status(200).json(doc)
        }).catch(err => {
            console.log(err)
            res.status(500).json(err)
        })
    }
})

router.get('/getformdata', (req, res) => {
    const {id} = req.query;
    Campaign.aggregate([
        { 
            $match : { 
                _id : ObjectId(id) 
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
        {
            $lookup: {
                from: 'teams',
                localField: 'team',
                foreignField: '_id',
                as: 'fundraisers'
            }
        }
    ]).then( async (doc) => {
        let item =  doc[0];
        doc[0].client = doc[0].client[0];
        let fundInfo = []
        for( let i = 0; i < item.fundraisers[0].fundraisersIds.length; i++) {
            let fund = item.fundraisers[0].fundraisersIds[i];
            await Fundraiser.find({_id: fund}).then(fundDoc => {
                fundInfo.push(fundDoc[0]);
            }).catch(err => {
                return res.status(500).json(err);
            })
        } 
        doc[0].fundraisers = fundInfo;
        res.status(200).json(doc[0])      
    }).catch(err => {
        res.status(500).json(err)
    });
})

router.post('/add', (req, res) => {
    const { name, source, client, contact, lead, team, status, description } = req.body;
    let campaign = new Campaign({ name: name, source:  source, client: client, contact: contact, lead: lead, team: team, status: status, description: description});
    Campaign.find({name: name})
        .then((doc) => {
            if(doc.length == 0) {
                campaign.save()
                    .then(user => {
                        res.status(200).json(user);
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json(err)
                    })
            } else {
                res.status(409).send('Campaign existing!')
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err)
        });   
});

router.post('/update', (req, res) => {
    const { id, name, source, contact, lead, client, status, description } = req.body;
    Campaign.update({_id: id}, { name: name, source:  source, contact: contact, lead: lead, client: client, status: status, description: description})
        .then((doc) => {
            res.status(200).json(doc);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err)
        });   
});

router.post('/delete', (req, res) => {
    const { id } = req.body;
    Campaign.deleteOne({_id: id})
        .then((doc) => {
            res.status(200).json(doc);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err)
        });   
});

module.exports = router;

