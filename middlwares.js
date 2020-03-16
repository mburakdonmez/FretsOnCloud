const custom_functions = require('./custom_functions');
const bcrypt = require('bcrypt');
const ObjectId = require('mongoose').Types.ObjectId

exports.checkIDarg = function (arg, { required = false, inBody = false, isArray = false, adminRequired = false }) {
    return (req, res, next) => {
        const convert_to_object_id = (raw) => {
            let final_result = null;
            if (Array.isArray(raw)) { final_result = raw.map(v => ObjectId(v)); }
            else if (raw) { final_result = ObjectId(raw); }
            
            if (inBody) { req.body[arg] = final_result; }
            else { req.query[arg] = final_result; }
            return next();
        }

        let checkMe = inBody ? req.body[arg] : req.query[arg]
        if (isArray === true && Array.isArray(checkMe)) {
            if (checkMe.every(elem => custom_functions.isValid(elem))) {
                convert_to_object_id(checkMe);
            } else {
                res.status(422).end(`field "${arg}" must be a valid id array`)
            }
        } else {
            if (!custom_functions.isEmpty(checkMe)) {
                if (custom_functions.isValid(checkMe)) {
                    convert_to_object_id(checkMe);
                } else {
                    res.status(422).end(`field "${arg}" must be a valid id`)
                }
            } else {
                if (required) {
                    res.status(422).end(`field "${arg}" is required`)
                } else {
                    if (adminRequired) {
                        if (req.session.user.isAdmin === true) {
                            res.status(422).end(`field "${arg}" is required for admins`)
                        } else {
                            convert_to_object_id(checkMe);
                        }
                    } else {
                        convert_to_object_id(checkMe);
                    }
                }
            }
        }
    }
}

exports.checkArg = function (arg, { required = false, inBody = false, check = custom_functions.isEmpty, not = true, message = 'field is required', enum_ = [] }) {
    return (req, res, next) => {
        let checkMe = inBody ? req.body[arg] : req.query[arg];
        if (custom_functions.isEmpty(checkMe)) {
            if (required) {
                return res.status(422).end(`field "${arg}" is required in request ${inBody ? 'body' : 'query'}`);
            } else {
                return next();
            }
        } else {
            let stat = check(checkMe);
            if (not) {
                stat = !stat
            }
            if (stat) {
                if (Array.isArray(enum_) && enum_.length > 0) {
                    if (enum_.includes(checkMe)) {
                        return next();
                    } else {
                        return res.status(422).end(`${arg} must be one of the followings: ${enum_.join(', ')}`);
                    }
                } else {
                    return next();
                }
            } else {
                return res.status(422).end(`${arg} ${message}`);
            }
        }
    }
}

exports.confirmPass = function (arg) {
    return (req, res, next) => {
        if (custom_functions.isNonEmptyString(req.body[arg])) {
            return bcrypt.compare(req.body[arg], req.user.password, (err, same) => {
                if (err) {
                    next(err);
                } else {
                    if (same === true) {
                        return next();
                    } else {
                        return res.status(401).end(`${arg} field must be the current password`);
                    }
                }
            })
        } else {
            return res.status(422).end(`${arg} field must be the current password`);
        }
    }
}

exports.vueTable = function () {
    return (req, res, next) => {
        //TODO
    }
}
