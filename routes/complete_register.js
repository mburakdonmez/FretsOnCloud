const express = require('express');
const router = express.Router();
const models = require('../models/models');
const path = require('path');
const middlewares = require('../middlwares');
const custom_functions = require('../custom_functions');

module.exports = router;

router.use((req, res, next) => {
    if (req.user && req.user.completed !== true) {
        return next();
    } else {
        return res.redirect('/');
    }
});

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../nonpublic_static/complete_register.html'))
});

router.post('/', middlewares.checkArg('nickname', { inBody: true, required: true, check: custom_functions.isNonEmptyString, not: false }), (req, res) => {
    models.users.model.updateOne({ _id: req.user._id }, { $set: { nickName: req.body.nickname, completed: true } }).exec((err, result) => {
        if (!err && result) {
            res.redirect('/?completed=true');
        } else {
            res.redirect('/complete');
        }
    })
});

router.get('/whoami', (req, res) => {
    res.json({
        email: req.user.email,
        fullName: req.user.fullName,
        image: req.user.image
    })
})

router.post('/nickNameCheck', middlewares.checkArg('nickName', { inBody: true, required: true, check: custom_functions.isNonEmptyString, not: false }), (req, res) => {
    models.users.model.findOne({ nickName: req.body.nickName }, { _id: 0, nickName: 1 }).exec((err, result) => {
        res.json({ available: Boolean(!err && !result) });
    })
})
