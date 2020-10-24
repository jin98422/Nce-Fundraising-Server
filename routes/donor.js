const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const router =  express.Router();
const path = require('path');
const { ObjectId } = require('mongodb')
const cybersourceRestApi = require('cybersource-rest-client');
// const filePath = path.resolve('config/Configuration.js');
// const configuration = require(filePath);

const Donor = require('../database/Donors');
const Source = require('../database/Sources');
const Client = require('../database/Clients');
const Team = require('../database/Teams');
const Campaign = require('../database/Campaigns');
const Fundraiser = require('../database/Fundraisers');
 
router.get('/', (req, res) => {
    Donor.aggregate([
        {
            $lookup: {
                from: 'campaigns',
                localField: 'campaign',
                foreignField: '_id',
                as: 'campaigns'
            }
        },
    ]).then( async (doc) => {
        for(let i = 0; i < doc.length; i++) {
            let item =  doc[i];
            doc[i].campaigns = item.campaigns[0];
            await Source.find({_id: item.campaigns.source}).then(result => {
                doc[i].campaigns.source = result[0];
            }).catch(err => {
                return res.status(500).json(err)
            })
            await Client.find({_id: item.campaigns.client}).then(result => {
                doc[i].campaigns.client = result[0];
            }).catch(err => {
                return res.status(500).json(err)
            })
            await Team.find({_id: item.campaigns.team}).then(async result => {
                let fundNames = '';
                for(let j in result[0].fundraisersIds) {
                    let fundId = result[0].fundraisersIds[j]
                    await Fundraiser.find({_id: fundId}).then(funds => {
                        fundNames += ', ' + funds[0].name
                    }).catch(err => {
                        return res.status(500).json(err)
                    })
                }
                fundNames = fundNames.replace(',', '');
                result[0].fundraisersIds = fundNames;
                doc[i].campaigns.team = result[0];
            }).catch(err => {
                return res.status(500).json(err)
            })
            if(item.status == "") doc[i].status = 'Not connected'
        }
        res.status(200).json(doc)
    }).catch(err => {
        console.log(err)
        res.status(500).json(err)
    })
})

router.post('/add', (req, res) => {
    const { fname, lname, street1, street2, city, state, zip, country, campaign, amount, age, gender, phone, email } = req.body;
    let donor = new Donor({ 
        fname: fname, 
        lname: lname, 
        street1: street1, 
        street2: street2, 
        city: city, 
        state: state, 
        zip: zip, 
        country: country, 
        campaign: campaign,
        amount: amount,
        age: age,
        gender: gender,
        phone: phone,
        email: email,
    });
    donor.save().then(user => {
        res.status(200).json(user);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err)
    })
});

router.post('/form', (req, res) => {
    const { fname, lname, street1, street2, city, state, zip, country, campaign, age, gender, phone, email, recurring, frequency, amount, cardNum, expMon, expYear, cvv, id } = req.body;
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
       let item = doc[0].client[0];
       console.log(item)

       try {
            var configObject = {
                'authenticationType': 'http_signature',	
                'runEnvironment': 'cybersource.environment.production',

                'merchantID': item.merchantKey,
                'merchantKeyId': item.key1,
                'merchantsecretKey': item.key2,
                
                'enableLog': true,
                'logFilename': 'cybs',
                'logDirectory': '../log',
                'logFileMaxSize': '5242880'
            }
            var apiClient = new cybersourceRestApi.ApiClient();
            var requestObj = new cybersourceRestApi.CreatePaymentRequest();

            var clientReferenceInformation = new cybersourceRestApi.Ptsv2paymentsClientReferenceInformation();
            clientReferenceInformation.code = 'TC50171_3';
            requestObj.clientReferenceInformation = clientReferenceInformation;

            var processingInformation = new cybersourceRestApi.Ptsv2paymentsProcessingInformation();
            processingInformation.capture = true;

            requestObj.processingInformation = processingInformation;

            var paymentInformation = new cybersourceRestApi.Ptsv2paymentsPaymentInformation();
            var paymentInformationCard = new cybersourceRestApi.Ptsv2paymentsPaymentInformationCard();
            paymentInformationCard.number = cardNum;
            paymentInformationCard.expirationMonth = expMon;
            paymentInformationCard.expirationYear = expYear;
            if(cvv != "") paymentInformationCard.securityCode = cvv;
            paymentInformation.card = paymentInformationCard;

            requestObj.paymentInformation = paymentInformation;

            var orderInformation = new cybersourceRestApi.Ptsv2paymentsOrderInformation();
            var orderInformationAmountDetails = new cybersourceRestApi.Ptsv2paymentsOrderInformationAmountDetails();
            orderInformationAmountDetails.totalAmount = amount;
            orderInformationAmountDetails.currency = 'USD';
            orderInformation.amountDetails = orderInformationAmountDetails;

            var orderInformationBillTo = new cybersourceRestApi.Ptsv2paymentsOrderInformationBillTo();
            orderInformationBillTo.firstName = fname;
            orderInformationBillTo.lastName = lname;
            orderInformationBillTo.address1 = street1;
            orderInformationBillTo.locality = city;
            orderInformationBillTo.administrativeArea = state;
            orderInformationBillTo.postalCode = zip;
            orderInformationBillTo.country = country;
            orderInformationBillTo.email = email;
            orderInformationBillTo.phoneNumber = phone;
            orderInformation.billTo = orderInformationBillTo;

            requestObj.orderInformation = orderInformation;


            var instance = new cybersourceRestApi.PaymentsApi(configObject, apiClient);

            instance.createPayment(requestObj, function (err, data, response) {
                if (err) {
                    console.log(err.response.text)
                    return res.status(500).json(err.response.text)
                }
                console.log(response.status)
                if(response.status == 201) {
                    if(data.status == 'AUTHORIZED') {
                        console.log('AUTHORIZED')
                        let donor = new Donor({ 
                            fname: fname, 
                            lname: lname, 
                            street1: street1, 
                            street2: street2, 
                            city: city, 
                            state: state, 
                            zip: zip, 
                            country: country, 
                            campaign: campaign,
                            age: age,
                            gender: gender,
                            phone: phone,
                            email: email,
                            recurring: recurring,
                            frequency: frequency,
                            amount: amount,
                            cardNum: cardNum,
                            expMon: expMon,
                            expYear: expYear,
                            cvv: cvv,
                            status: data.status
                        });
                        donor.save().then(user => {
                            res.status(200).json(user);
                        })
                        .catch(err => {
                            console.log(err);
                            res.status(500).json(err)
                        })
                    } else {
                        console.log('NOT AUTHORIZED')
                        res.status(201).json(data.errorInformation);
                    }
                    
                } else {
                    res.status(response.status).json(data);
                }
                console.log(data)
            });
        }
        catch (err) {
            console.log(err);
            res.status(500).json(err)
        }
    }).catch(err => {
        console.log(doc)
        res.status(500).json(err)
    })
    
   
});

router.post('/update', (req, res) => {
    const { id, fname, lname, street1, street2, city, state, zip, country, campaign, amount, age, gender, phone, email } = req.body;
    Donor.update({_id: id}, {
        fname: fname, 
        lname: lname, 
        street1: street1, 
        street2: street2, 
        city: city, 
        state: state, 
        zip: zip, 
        country: country, 
        campaign: campaign,
        amount: amount,
        age: age,
        gender: gender,
        phone: phone,
        email: email,
    }).then((doc) => {
        res.status(200).json(doc);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err)
    });   
});

router.post('/delete', (req, res) => {
    const { id } = req.body;
    Donor.deleteOne({_id: id})
        .then((doc) => {
            res.status(200).json(doc);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err)
        });   
});

module.exports = router;

