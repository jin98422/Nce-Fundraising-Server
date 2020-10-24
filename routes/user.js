const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const router =  express.Router();
const sgMail = require('@sendgrid/mail');

const User = require('../database/Users');
const Role = require('../database/Roles');
 
const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_LIFE, SENDGRID_API_KEY, HOST, DOMAIN } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

router.get('/', (req, res) => {
    console.log(req.query.role)
    const {role} = req.query
    if(req.query.role) {
        User.find({role: role, email: { $ne: 'admin@dev.com'}}).then(doc => {
            res.status(200).json(doc)
        }).catch(err => {
            res.status(500).json(err)
        })
    } else {
        User.find({email: { $ne: 'admin@dev.com'}}).then(doc => {
            res.status(200).json(doc)
        }).catch(err => {
            res.status(500).json(err)
        })
    }
})

router.get('/getadmin', (req, res) => {
    User.find({role: { $in: ['1', '2', '3']}}).then(doc => {
        res.status(200).json(doc)
    }).catch(err => {
        res.status(500).json(err)
    })
})

router.post('/admin', async (req,res) => {
    const { email, password } = req.body;
    User.find({email: email, password: password, role: { $in: ["0", "1"]}})
    .then((doc) => {
        if(doc.length != 0) {
            const userInfo = {
                "username": "doc[0].username",
                "email": email,
                "password": password
            }
            // do the database authentication here, with user name and password combination.
            const admin = jwt.sign(userInfo, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_LIFE})
            const response = {
                "admin": admin,
            }
            User.update({email: email, password: password}, {
                "admin": admin
            }).then(doc => {
                res.status(200).json(response);
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

router.post('/checkEmail', async (req,res) => {
    const { email } = req.body;    
    User.find({email: email})
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
    User.find({email: email, password: password})
    .then((doc) => {
        if(doc.length != 0) {
            const userInfo = {
                username: doc[0].username,
                email: email,
                password: password,
                role: doc[0].role
            }
            // do the database authentication here, with user name and password combination.
            const token = jwt.sign(userInfo, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_LIFE})
            const response = {
                "token": token,
            }
            User.update({email: email, password: password}, {
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


router.post('/forgot', async (req,res) => {
    const { email } = req.body; 
    User.find({email: email})
    .then((doc) => {
        if(doc.length != 0) {
            const userInfo = {
                username: doc[0].username,
                email: email,
                role: doc[0].role
            }
            // do the database authentication here, with user name and password combination.
            const token = jwt.sign(userInfo, ACCESS_TOKEN_SECRET)
            let link = `${HOST}/api/user/forgot/${token}`;
            const msg = {
                to: `${email}`,
                from: 'NCE - NEW CANVASSING EXPERIENCE <alexsenn422@gmail.com>',
                subject: 'RESET PASSWORD',
                html: `<p style="font-size: 28px; line-height: 1.2; text-align: center;">
                            <span style="font-size: 28px;"><strong><span>Hello ${doc[0].username},</span></strong></span><br>
                        </p>
                        <p style="font-size: 14px; line-height: 1.5; text-align: center; word-break: break-word; margin: 0;">We heard that you lost your password. Sorry about that!</p>
                        <div class="button-container" align="center" style="padding-top:25px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
                            <a href='${link}' target='_blank'>
                                <div style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#a8bf6f;border-radius:4px;-webkit-border-radius:4px;-moz-border-radius:4px;width:auto; width:auto;;border-top:1px solid #a8bf6f;border-right:1px solid #a8bf6f;border-bottom:1px solid #a8bf6f;border-left:1px solid #a8bf6f;padding-top:15px;padding-bottom:15px;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;text-align:center;word-break:keep-all;">
                                    <span style="padding-left:15px;padding-right:15px;font-size:16px;display:inline-block;">
                                        <span style="font-size: 16px; line-height: 2; word-break: break-word;">RESET PASSWORD</span>
                                    </span>
                                </div>
                            </a>
                        </div>`
            };
            sgMail.send(msg).then(() => {
                res.status(200).send("Confirm Email Sent");
            }).catch((error) => {
                console.log(error.response.body)
                res.status(500).json(err)
            })
        } else {
            res.status(404).send('Invalid request')
        }
    })
    .catch(err => {
        console.log(err);
        res.status(404).json(err)
    }); 
})

router.get('/forgot/:token', (req, res) => {
    console.log(req.params)
    jwt.verify(req.params.token, ACCESS_TOKEN_SECRET, function(err, decoded) {
        if (err) {
            return res.json(err);
        }
        const userInfo = {
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            status: 'reset'
        }
        const token = jwt.sign(userInfo, ACCESS_TOKEN_SECRET)
        return res.redirect(`${DOMAIN}/account/confirm/${token}`);
    })
});

router.post('/register', (req, res) => {
    const { email, username, role } = req.body;
    const userInfo = {
        email: email,
        username: username,
        role: role
    }
    const token = jwt.sign(userInfo, ACCESS_TOKEN_SECRET)
    let user = new User({ email: email, username: username, role: role, token: token});
    User.find({email: email}).then((doc) => {
        if(doc.length == 0) {
            user.save().then( async (user) => {
                Role.find({index: role}).then(roleName => {
                    let link = `${HOST}/api/user/account/${token}`;
                    const msg = {
                        to: `${email}`,
                        from: 'NCE - NEW CANVASSING EXPERIENCE <alexsenn422@gmail.com>',
                        subject: 'CONFIRM YOUR ACCOUNT',
                        html: `<p style="font-size: 28px; line-height: 1.2; text-align: center;">
                                    <span style="font-size: 28px;"><strong><span>Hello ${username},</span></strong></span><br>
                                    <span style="font-size: 28px;">We have registered your email!</span>
                                </p>
                                <p style="font-size: 14px; line-height: 1.5; text-align: center;">
                                    Thanks so much for joining Our Site!<br>
                                    Your role is: <span style="color: #a8bf6f; font-size: 14px;"><strong>${roleName[0].name}<br></strong></span>
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
                    sgMail.send(msg).then(() => {
                        console.log("Confirm Email Sent")
                        res.status(200).send("Confirm Email Sent");
                    }).catch((error) => {
                        console.log(error.response.body)
                        res.status(500).json(err)
                    })
                }).catch(err => {
                    console.log(err);
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
});

router.get('/account/:token', (req, res) => {
    console.log(req.params)
    User.find({token: req.params.token}).then(doc => {
        if(doc.length == 0) {
            res.send('You have already activated your account! please sign in your account.')
        } else {
            jwt.verify(req.params.token, ACCESS_TOKEN_SECRET, function(err, decoded) {
                if (err) {
                    return res.json(err);
                }
                const userInfo = {
                    email: decoded.email,
                    username: decoded.username,
                    role: decoded.role,
                    status: 'new'
                }
                const token = jwt.sign(userInfo, ACCESS_TOKEN_SECRET)
                User.update({ email: decoded.email}, {token: token})
                .then((doc) => {
                    return res.redirect(`${DOMAIN}/account/confirm/${token}`);
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json(err)
                });                
                
            })
        }
    })
    
});

router.post('/update', (req, res) => {
    const { id, email, username, role } = req.body;
    User.update({_id: id}, { email: email, username: username, role: role})
        .then((doc) => {
            res.status(200).json(doc);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err)
        });   
});

router.post('/reset', (req, res) => {
    const { email, password } = req.body;
    User.findOneAndUpdate({email: email},{ password: password, active: true }, {new: true} )
        .then((doc) => {
            const userInfo = {
                username: doc.username,
                email: email,
                password: password,
                role: doc.role
            }
            // do the database authentication here, with user name and password combination.
            const token = jwt.sign(userInfo, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_LIFE})
            const response = {
                "token": token,
            }
            User.update({email: email, password: password}, {
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

router.post('/delete', (req, res) => {
    const { id } = req.body;
    User.deleteOne({_id: id})
        .then((doc) => {
            res.status(200).json(doc);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err)
        });   
});

module.exports = router;

