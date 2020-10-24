const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const router =  express.Router();
const multer = require('multer');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('config/Configuration.js');
const configuration = require(filePath);

const Client = require('../database/Clients');
const Campaign = require('../database/Campaigns');

let uploadStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        console.log(file)
        callback(null, "./public/client")
    },
    filename: function(req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
})

let upload = multer({storage: uploadStorage})

const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_LIFE } = process.env;

router.get('/', async (req,res) => {
    var configObject = new configuration();
    console.log('configObject', configObject)
    Client.aggregate([{
        $lookup: {
            from: 'campaigns',
            localField: '_id',
            foreignField: 'client',
            as: 'campaigns'
        }
    }]).then(doc => {
        for(let i = 0; i < doc.length; i++) {
            let item =  doc[i];
            doc[i].campaigns = item.campaigns.length;
        }
        res.status(200).json(doc)
    }).catch(err => {
        console.log(err)
        res.json(err)
    })
})

router.post('/add', upload.fields([{name: 'profile', maxCount: 1}, {name: 'header', maxCount: 1}]), async (req,res) => {
    let profile = ""
    let header = ""
    if(req.files.profile[0].filename != undefined) {
        profile = '/images/client/' + req.files.profile[0].filename;
    }
    if(req.files.header[0].filename != undefined) {
        header = '/images/client/' + req.files.header[0].filename;
    }
    const { name, email, color, phone, contact, description, status, payment, key1, key2, merchantKey } = req.body;
    let newClient = new Client({
        name: name,
        email: email,
        profile: profile,
        header: header,
        color: color,
        phone: phone,
        contact: contact,
        status: status,
        payment: payment,
        description: description,
        key1: key1,
        key2: key2,
        merchantKey: merchantKey,
    });
    Client.find({email: email}).then(doc => {
        if(doc.length == 0) {
             newClient.save().then(doc => {
                res.status(200).json(doc)
            }).catch(err => {
                res.status(500).json(err)
            })
        } else {
            res.status(409).send("This email already registered.")
        }
    }).catch(err => {
        res.status(500).json(err)
    })
   
})

router.post('/edit', upload.fields([{name: 'profile', maxCount: 1}, {name: 'header', maxCount: 1}]), async (req,res) => {
    let profile = ""
    let header = ""
    if(req.files.profile[0].filename != undefined) {
        profile = '/images/client/' + req.files.profile[0].filename;
    }
    if(req.files.header[0].filename != undefined) {
        header = '/images/client/' + req.files.header[0].filename;
    }
    const { id, name, email, phone, color, contact, description, status, payment, key1, key2, merchantKey } = req.body;
    let updateClient = {};
    if(profile != "" && header != "") {
        await Client.find({_id: id}).then(doc => {
            if(doc.length != 0) {
                fs.unlink(doc[0].profile, function(err){
                    if(err) throw err;
                    console.log('profile phote deleted')
                })
                fs.unlink(doc[0].header, function(err){
                    if(err) throw err;
                    console.log('header photo deleted')
                })
            }            
        })
        updateClient = {
            name: name,
            email: email,
            profile: profile,
            header: header,
            color: color,
            phone: phone,
            contact: contact,
            status: status,
            payment: payment,
            description: description,
            key1: key1,
            key2: key2,
            merchantKey: merchantKey,
        };
    } else if(profile != "") {
        await Client.find({_id: id}).then(doc => {
            if(doc.length != 0) {
                fs.unlink(doc[0].profile, function(err){
                    if(err) throw err;
                    console.log('profile phote deleted')
                })
            }
            
        })
        updateClient = {
            name: name,
            email: email,
            profile: profile,
            color: color,
            phone: phone,
            contact: contact,
            status: status,
            payment: payment,
            description: description,
            key1: key1,
            key2: key2,
            merchantKey: merchantKey,
        };
    } else if(header != "") {
        await Client.find({_id: id}).then(doc => {
            if(doc.length != 0) {
                fs.unlink(doc[0].header, function(err){
                    if(err) throw err;
                    console.log('header photo deleted')
                })
            }            
        })
        updateClient = {
            name: name,
            email: email,
            header: header,
            color: color,
            phone: phone,
            contact: contact,
            status: status,
            payment: payment,
            description: description,
            key1: key1,
            key2: key2,
            merchantKey: merchantKey,
        };
    } else {
        updateClient = {
            name: name,
            email: email,
            color: color,
            phone: phone,
            contact: contact,
            status: status,
            payment: payment,
            description: description,
            key1: key1,
            key2: key2,
            merchantKey: merchantKey,
        };
    }
    await Client.update({_id: id}, updateClient).then(doc => {
        res.status(200).json(doc)
    }).catch(err => {
        res.json(err)
    })
})

router.post('/delete', async (req,res) => {
    const { id } = req.body;
    await Client.find({_id: id}).then(doc => {
        if(doc.length != 0) {
            fs.unlink(doc[0].profile, function(err){
                if(err) throw err;
                console.log('profile phote deleted')
            })
            fs.unlink(doc[0].header, function(err){
                if(err) throw err;
                console.log('header photo deleted')
            })
        }
        
    })
    await Client.deleteOne({_id: id}).then(doc => {
        res.status(200).json(doc)
    }).catch(err => {
        res.json(err)
    })
})


module.exports = router;

