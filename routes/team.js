const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const router =  express.Router();

const Team = require('../database/Teams');
 
router.get('/', (req, res) => {
    const { fundraiserId } = req.query;
    if(fundraiserId) {
        Team.find({fundraisersIds: fundraiserId}).then(doc => {
            res.status(200).json(doc)
        }).catch(err => {
            res.status(500).json(err)
        })
    } else {
        Team.aggregate([
            {
                $addFields: {
                    fundraisers: { $size: "$fundraisersIds"}
                }
            }
        ]).then(doc => {
            res.status(200).json(doc)
        }).catch(err => {
            res.status(500).json(err)
        })
    }
    
})

router.post('/add', (req, res) => {
    const { leader, name, city, state, type, status, fundraisersIds } = req.body;
    let team = new Team({ leader: leader, name: name, city: city, state: state, type: type, status: status, fundraisersIds: fundraisersIds});
    Team.find({name: name})
        .then((doc) => {
            if(doc.length == 0) {
                team.save()
                    .then(user => {
                        res.status(200).json(user);
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json(err)
                    })
            } else {
                res.status(409).send('Team existing!')
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err)
        });   
});

router.post('/update', (req, res) => {
    const { id, leader, name, city, state, type, status, fundraisersIds } = req.body;
    Team.update({_id: id}, { leader: leader, name: name, city: city, state: state, type: type, status: status, fundraisersIds: fundraisersIds})
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
    Team.deleteOne({_id: id})
        .then((doc) => {
            res.status(200).json(doc);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err)
        });   
});

module.exports = router;

