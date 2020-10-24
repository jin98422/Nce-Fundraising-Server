const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const router =  express.Router();

const Source = require('../database/Sources');
 
router.get('/', (req, res) => {
    Source.aggregate([
        {
            $lookup: {
                from: 'clients',
                localField: 'client',
                foreignField: '_id',
                as: 'clientName'
            }
        },
        {
            $lookup: {
                from: 'campaigns',
                localField: '_id',
                foreignField: 'source',
                as: 'campaigns'
            }
        }
    ]).then(doc => {
        for(let i = 0; i < doc.length; i++) {
            let item =  doc[i];
            doc[i].clientName = item.clientName[0].name;
            doc[i].campaigns = item.campaigns.length;
        }
        res.status(200).json(doc)
    }).catch(err => {
        console.log(err)
        res.status(500).json(err)
    })
})

router.post('/add', (req, res) => {
    const { client, method, status, street1, street2, city, state, zip, sourceId } = req.body;
    let team = new Source({ client: client, method: method, status: status, street1: street1, street2: street2, city: city, state: state, zip: zip, id: sourceId});
    Source.find({id: sourceId})
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
                res.status(409).send('Source Id existing!')
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err)
        });   
});

router.post('/update', (req, res) => {
    const { id, client, method, status, street1, street2, city, state, zip, sourceId } = req.body;
    Source.update({_id: id}, { client: client, method: method, status: status, street1: street1, street2: street2, city: city, state: state, zip: zip, id: sourceId})
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
    Source.deleteOne({_id: id})
        .then((doc) => {
            res.status(200).json(doc);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err)
        });   
});

module.exports = router;

