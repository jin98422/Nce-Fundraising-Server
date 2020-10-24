const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const router =  express.Router();
const multer = require('multer');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const { ObjectId } = require('mongodb')

const Fundraiser = require('../database/Fundraisers');
const Campaign = require('../database/Campaigns');
const Team = require('../database/Teams');
const Donor = require('../database/Donors');

let uploadStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        console.log(file)
        callback(null, "./public/fundraiser")
    },
    filename: function(req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
});

let upload = multer({storage: uploadStorage});

const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_LIFE, SENDGRID_API_KEY, HOST, DOMAIN } = process.env;

router.get('/', async (req,res) => {
    Fundraiser.aggregate([
        {
            $lookup: {
                from: 'campaigns',
                localField: '_id',
                foreignField: 'client',
                as: 'campaigns'
            }
        }
    ]).then(doc => {
        for(let i = 0; i < doc.length; i++) {
            let item =  doc[i];
            if(item.campaigns.length != 0) {
                Campaign.find({team: item.campaigns._id}).then(result => {
                    doc[i].campaigns = result.length
                }).catch(err => {
                    console.log(err)
                }) 
            } else {
                doc[i].campaigns = 0;
            }
        }
        res.status(200).json(doc)
    }).catch(err => {
        res.json(err)
    })
})

router.get('/getData', async (req,res) => {
    const { id } = req.query
    console.log(id)
    let allCampaigns = [];
    let allDonors = [];
    Team.find({fundraisersIds: id}).then(async doc => {
        for(let i in doc) {
            let team = doc[i];
            await Campaign.aggregate([
                {
                    $match: {
                        'team': team._id
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
            ]).then(campaigns => {
                Array.prototype.push.apply(allCampaigns,campaigns); 
            }).catch(err => {
                console.log(err)
                return res.status(500).json(err)
            })
        }
        for(let i in allCampaigns) {
            let campaign = allCampaigns[i];
            await Donor.find({campaign: campaign._id}).then(donors => {
                console.log(donors)
                Array.prototype.push.apply(allDonors,donors);
            }).catch(err => {
                console.log(err)
                return res.status(500).json(err)
            })
        }
        res.status(200).json({
            allCampaigns: allCampaigns,
            allDonors: allDonors
        })
    }).catch(err => {
        console.log(err)
        res.status(500).json(err)
    })
})

router.post('/checkEmail', async (req,res) => {
    const { email } = req.body;    
    Fundraiser.find({email: email})
    .then((doc) => {
        if(doc.length != 0) {
            if(doc[0].active) {
                res.status(200).json(doc[0])
            } else {
                res.status(401).send('This account not active. Please check your email and activate your account.')
            }
        } else {
            res.status(403).send('Invalid request')
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err)
    }); 
})

router.post('/login', async (req,res) => {
    const { email, password } = req.body;    
    Fundraiser.find({email: email, password: password})
    .then((doc) => {
        if(doc.length != 0) {
            const userInfo = {
                name: doc[0].name,
                email: email,
                password: password,
                status: doc[0].status,
                id: doc[0]._id
            }
            // do the database authentication here, with user name and password combination.
            const token = jwt.sign(userInfo, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_LIFE})
            const response = {
                "token": token,
            }
            Fundraiser.update({email: email, password: password}, {
                "token": token
            }).then(user => {
                res.status(200).json(response);
            }).catch(err => {
                res.status(500).json(err)
            })            
        } else {
            res.status(403).send('Invalid request')
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err)
    }); 
})

router.post('/add', upload.single("photo"), async (req,res) => {
    let photo = ""
    if(req.file.filename != undefined) {
        photo = '/images/fundraiser/' + req.file.filename;
    }
    const { name, email, phone, contact, status } = req.body;
    const fundraiserInfo = {
        name: name,
        email: email,
        status: status
    }
    const token = jwt.sign(fundraiserInfo, ACCESS_TOKEN_SECRET)
    let newFundraiser = new Fundraiser({
        name: name,
        email: email,
        photo: photo,
        phone: phone,
        contact: contact,
        status: status,
        token: token,
    });
    Fundraiser.find({email: email}).then((doc) => {
        if(doc.length == 0) {
            newFundraiser.save().then( async (user) => {
                let link = `${HOST}/api/fundraiser/account/${token}`;
                const msg = {
                    to: `${email}`,
                    from: 'NCE - NEW CANVASSING EXPERIENCE <alexsenn422@gmail.com>',
                    subject: 'CONFIRM YOUR ACCOUNT',
                    html: `<p style="font-size: 28px; line-height: 1.2; text-align: center;">
                                <span style="font-size: 28px;"><strong><span>Hello ${name},</span></strong></span><br>
                                <span style="font-size: 28px;">We have registered your email!</span>
                            </p>
                            <p style="font-size: 14px; line-height: 1.5; text-align: center;">
                                Thanks so much for joining Our Site!<br>
                                Your role is: <span style="color: #a8bf6f; font-size: 14px;"><strong>Fundraiser<br></strong></span>
                            </p>
                            <p style="font-size: 14px; line-height: 1.5; text-align: center; word-break: break-word; margin: 0;">TO FINISH SIGNING UP AND ACTIVATE YOUR ACCOUNT<br>YOU JUST NEED TO SET YOUR PASSWORD</p>
                            <div class="button-container" align="center" style="padding-top:25px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
                                <a href='${link}' target='_blank'>
                                    <div style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#a8bf6f;border-radius:4px;-webkit-border-radius:4px;-moz-border-radius:4px;width:auto; width:auto;;border-top:1px solid #a8bf6f;border-right:1px solid #a8bf6f;border-bottom:1px solid #a8bf6f;border-left:1px solid #a8bf6f;padding-top:15px;padding-bottom:15px;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;text-align:center;word-break:keep-all;">
                                        <span style="padding-left:15px;padding-right:15px;font-size:16px;display:inline-block;">
                                            <span style="font-size: 16px; line-height: 2; word-break: break-word;">ACTIVATE MY ACCOUNT</span>
                                        </span>
                                    </div>
                                </a>
                            </div>`
                };
                sgMail.send(msg).then((data) => {
                    console.log(data)
                    console.log("Confirm Email Sent")
                    res.status(200).send("Confirm Email Sent");
                }).catch((err) => {
                    console.log(err)
                    res.status(500).json(err)
                })
            })
            .catch(err => {
                console.log(err);
                res.status(500).json(err)
            })
        } else {
            res.status(409).send('Email existing!')
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err)
    });  
})


router.get('/account/:token', (req, res) => {
    console.log(req.params)
    Fundraiser.find({token: req.params.token}).then(doc => {
        if(doc.length == 0) {
            res.send('You have already activated your account! please sign in your account.')
        } else {
            jwt.verify(req.params.token, ACCESS_TOKEN_SECRET, function(err, decoded) {
                if (err) {
                    return res.json(err);
                }
                const userInfo = {
                    name: decoded.name,
                    email: decoded.email,
                    status: decoded.status
                }
                const token = jwt.sign(userInfo, ACCESS_TOKEN_SECRET)
                Fundraiser.update({ email: decoded.email}, {token: token})
                .then((doc) => {
                    return res.redirect(`${DOMAIN}/fundraiser/account/confirm/${token}`);
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json(err)
                });                
                
            })
        }
    })
    
});

router.post('/reset', (req, res) => {
    const { email, password } = req.body;
    Fundraiser.findOneAndUpdate({email: email},{ password: password, active: true }, {new: true} )
        .then((doc) => {
            const fundraiserInfo = {
                name: doc.name,
                email: email,
                password: password,
                status: doc.status,
                id: doc._id
            }
            // do the database authentication here, with user name and password combination.
            const token = jwt.sign(fundraiserInfo, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_LIFE})
            const response = {
                "token": token,
            }
            Fundraiser.update({email: email, password: password}, {
                "token": token
            }).then(doc => {
                res.status(200).json(response);
            }).catch(err => {
                console.log(err);
                res.status(500).json(err)
            })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err)
        });   
});

router.post('/edit', upload.single("photo"), async (req,res) => {
    let photo = ""
    if(req.file.filename != undefined) {
        photo = '/images/fundraiser/' + req.file.filename;
    }
    const { id, name, email, phone, contact, status } = req.body;
    let updateFundraiser = {};
    if(photo == "") {
        updateFundraiser = {
            name: name,
            email: email,
            phone: phone,
            contact: contact,
            status: status,
            campaigns: 0
        };
    } else {
        updateFundraiser = {
            name: name,
            email: email,
            photo: photo,
            phone: phone,
            contact: contact,
            status: status,
            campaigns: 0
        };
        await Fundraiser.find({_id: id}).then(doc => {
            if(doc.length != 0) {
                fs.unlink(doc[0].photo, function(err){
                    if(err) throw err;
                    console.log('profile phote deleted')
                })
            }
        })
    }  
    await Fundraiser.update({_id: id}, updateFundraiser).then(doc => {
        res.status(200).json(doc)
    }).catch(err => {
        res.status(500).json(err)
    })
})

router.post('/delete', async (req,res) => {
    const { id } = req.body;
    await Fundraiser.find({_id: id}).then(doc => {
        if(doc.length != 0) {
            fs.unlink(doc[0].photo, function(err){
                if(err) throw err;
                console.log('profile phote deleted')
            })
        }
        
    })
    await Fundraiser.deleteOne({_id: id}).then(doc => {
        res.status(200).json(doc)
    }).catch(err => {
        res.json(err)
    })
})

module.exports = router;