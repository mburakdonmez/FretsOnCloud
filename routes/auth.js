const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const models = require('../models/models');

module.exports = router;

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((user, done) => {
    models.users.model.findOne({ _id: user }).exec(done);
});

passport.use(new GoogleStrategy({
    clientID: "120332914652-sku5s9ho058bg1fkcp0t13tkk979vkhg.apps.googleusercontent.com",
    clientSecret: "T_zBdHf92HSyhmWerSWYTOQI",
    callbackURL: "https://fretsoncloud.com/auth/google/callback",
    scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email'],
    failureRedirect: '/login',
    failureFlash: true
}, function (accessToken, refreshToken, profile, cb) {
    models.users.find_or_create(profile, cb);
}
));

router.use((req, res, next) => {
    if (req.user) {
        return res.redirect('/');
    } else {
        return next();
    }
});

router.get('/google', passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }));

router.get('/google/callback', passport.authenticate('google', { failureFlash: true, failureRedirect: '/?login=false', successRedirect: '/complete' }));

