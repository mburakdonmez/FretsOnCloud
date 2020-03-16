const mongoose = require('mongoose');
const models = require('./models/models');

const ok = { status: true, error: false, null: false }
const er = { error: 'Internal server error', status: false }
const nl = { status: false, error: false, null: true }
const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;


exports.isEmpty = (param) => {
    return (typeof param === "undefined" || param === null || ((typeof param) === "string" && param.trim() === "") || (Array.isArray(param) && param.length === 0) || ((typeof param) === "object" && (Object.entries(param).length === 0 && param.constructor === Object)));
}

exports.isNonEmptyString = (param, min_length = 0) => {
    return (!exports.isEmpty(param) && (typeof param === 'string' || param instanceof String) && param.length > min_length);
}

exports.isValidArray = ({ check_func = exports.isNonEmptyString, min_length = 0, max_length = -1 }) => {
    return (param) => {
        return (Array.isArray(param) && param.length >= min_length && (max_length === -1 ? true : param.length <= max_length) && (param.length === 0 ? true : param.every(v => check_func(v))))
    }
}

exports.isInteger = (param, { min = null, max = null }) => {
    const n = Number.parseInt(param);
    return (!exports.isEmpty(param) && Number.isInteger(n) && ((min === null ? true : n >= min) && (max === null ? true : n <= max)))
}

exports.isBoolean = (param) => {
    return (!exports.isEmpty(param) && typeof param === 'boolean')
}

exports.isValidEmail = (param) => {
    return (exports.isNonEmptyString(param, 5) && param.includes('@') && !param.endsWith('@') && param.split('@')[1].includes('.') && !param.endsWith('.') && emailRegexp.test(param));
}

exports.isValid = (ObjectId) => {
    return (mongoose.Types.ObjectId.isValid(ObjectId) && (String(mongoose.Types.ObjectId(ObjectId)) === String(ObjectId)))
}

const error_handler = (req, res, err, result, error_message, callback = (err, res) => { }) => {
    if (err.code === 11000) { //error for duplicates
        res.status(409).json({ status: false, error: 'duplicate' });
        return callback(err, result);
    } else {
        if (err.name === 'ValidationError') {
            return res.status(422).json({ status: false, error: 'ValidationError' });
        } else {
            if (exports.isNonEmptyString(err.custom_message)) {
                return res.status(400).json({ status: false, error: err.custom_message });
            } else {
                console.log(error_message ? `-${req.originalUrl} ${error_message}` : `-${req.originalUrl} unexpected error`, err)
                res.status(500).json(er);
                return callback(err, result);
            }
        }
    }
}

exports.return_result = (req, res, error_message = '', callback = (err, res) => { }) => {
    return (err, result) => {
        if (err) {
            error_handler(req, res, err, result, error_message, callback);
        } else {
            if (result) {
                res.json(result);
            } else {
                res.json(nl);
            }

        }
        callback(err, result);
    }
}

exports.return_ok = (req, res, error_message = '', callback = (err, res) => { }) => {
    return (err, result) => {
        if (err) {
            error_handler(req, res, err, result, error_message, callback);
        } else {
            if (result) {
                res.json(ok);
            } else {
                res.json(nl);
            }
            callback(err, result);
        }
    }
}


/**
 * @returns {Promise}
 */
exports.return_ok_promise = (prms, req, res, error_message = '') => {
    prms.then((result) => {
        if (result) {
            res.json(ok);
        } else {
            res.json(nl);
        }
        return result
    }).catch((err) => {
        if (err) {
            error_handler(req, res, err, null, error_message)
        } else {
            res.json(nl);
        }
        return err;
    })
    return prms;
}

/**
 * @returns {Promise}
 */
exports.return_result_promise = (prms, req, res, error_message = '') => {
    return prms.then((result) => {
        if (result) {
            res.json(result);
        } else {
            res.json(nl);
        }
        return result
    }).catch((err) => {
        if (err) {
            error_handler(req, res, err, null, error_message)
        } else {
            res.json(nl);
        }
        return err;
    });
}


exports.solvePageinationQuery = function (req, total, default_per_page = 20, max_perPage = 1500, default_current_page = 0) {
    let page = req.query.page ? Number(req.query.page) - 1 : default_current_page;
    let perPage = req.query.per_page ? Number(req.query.per_page) : default_per_page;
    perPage = max_perPage === 0 ? perPage : Math.min(perPage, 250);
    let skip = page * perPage;
    let limit = perPage;

    let requestedUrl = req.protocol + '://' + req.get('Host') + req.originalUrl;
    let nextPage = null;
    let prevPage = null;
    let lastPage = null;
    if (total >= 0) {
        lastPage = Math.ceil(total / perPage)
        if (page + 1 < lastPage) {
            let next_page = new URL(requestedUrl);
            next_page.searchParams.set('page', String(page + 2))
            nextPage = next_page.href;
        }
    } else if (typeof total === 'undefined') {
        let next_page = new URL(requestedUrl);
        next_page.searchParams.set('page', String(page + 2))
        nextPage = next_page.href;
    }

    if (page > 0) {
        let prev_page = new URL(requestedUrl);
        prev_page.searchParams.set('page', String(page))
        prevPage = prev_page.href;
    }

    return { skip: skip, limit: limit, page: page, perPage: perPage, nextPage: nextPage, prevPage: prevPage }
}

exports.solveSortQuery = function (req, allow, default_sort = '_id', default_sort_dir = -1) {
    let sort = {}
    if (req.query.sort) {
        let sortStr = req.query.sort;
        let sort_field = sortStr.split('|')[0];
        let sort_direction = sortStr.split('|')[1];

        if (allow.indexOf(sort_field) >= 0) {
            if (sort_direction.toLowerCase() == 'asc') {
                sort = {}
                sort[sort_field] = 1
            } else {
                sort = {}
                sort[sort_field] = -1
            }
        }
    }

    if (exports.isEmpty(sort)) {
        sort = { [default_sort]: default_sort_dir }
    }
    return sort
}

/**
 * @param {Object} req               express req object.
 * @param {Object} fields            [{ field: 'something', array: "-1,'0',1", default: null }].
 * @param {Object} initialFilter     The base filter
 */
exports.solveFilterQuery = (req, fields, initialFilter = {}) => {
    let filter = initialFilter;
    fields.forEach(f => {
        let field;
        let array;
        let defoult;
        if (!exports.isEmpty(f.field)) {
            field = f;
            array = 0;
            defoult = null;
        } else {
            field = f.field;
            array = exports.isEmpty(f.array) ? 0 : f.array === true;
            defoult = exports.isEmpty(f.defoult) ? null : f.defoult;
        }
        if (!exports.isEmpty(req.query[f])) {
            if (Array.isArray(req[f])) {
                if (array === -1) {
                    filter[f] = req[f];
                } else {
                    filter[f] = { $in: req[f] };
                }
            } else {
                if (array === 1) {
                    filter[f] = { $in: [req[f]] };
                } else {
                    filter[f] = req[f];
                }

            }
        } else {
            if (!exports.isEmpty(defoult)) {
                filter[field] = defoult;
            }
        }
    });
    return filter;
}

exports.createVueTableResult = (req, res, model, {
    sort_allow = [created_at, date],
    filter_array = [],
    initial_filter = {},
    pagination = exports.solvePageinationQuery(req),
    sort = exports.solveSortQuery(req, sort_allow),
    filter = Array.isArray(filter_array) ? exports.solveFilterQuery(req, filter_array, initial_filter) : {},
    select = {},
    populate = [],
    callback = exports.return_result(req, res) }) => {
    //{ skip, limit, page, perPage, nextPage, prevPage }
    model.find(filter).countDocuments().exec((err, docCount) => {
        if (err) {
            callback(err);
        } else {
            model.find(filter, select, { skip: pagination.skip, limit: pagination.limit, sort: sort }).populate(populate).lean().exec((err, result) => {
                if (err) {
                    callback(err);
                } else {
                    let response = {
                        data: result,
                        total: docCount,
                        per_page: pagination.perPage,
                        current_page: pagination.page + 1,
                        from: pagination.skip,
                        to: Math.min((pagination.skip + pagination.limit), docCount),
                        last_page: Math.ceil(docCount / pagination.perPage),
                        next_page_url: Math.ceil(docCount / pagination.perPage) > pagination.page + 1 ? pagination.nextPage : null,
                        prev_page_url: pagination.prevPage
                    }
                    callback(null, response);
                }
            })
        }
    })
}

exports.createVueTableResult_promise = async function (req, res, model, {
    sort_allow = [created_at, date],
    filter_array = [],
    initial_filter = {},
    pagination = exports.solvePageinationQuery(req),
    sort = exports.solveSortQuery(req, sort_allow),
    filter = Array.isArray(filter_array) ? exports.solveFilterQuery(req, filter_array, initial_filter) : {},
    select = {},
    populate = [] }) {

    const docCount = await model.find(filter).countDocuments().exec();
    const result = await model.find(filter, select, { skip: pagination.skip, limit: pagination.limit, sort: sort }).populate(populate).lean().exec();
    return {
        data: result,
        total: docCount,
        per_page: pagination.perPage,
        current_page: pagination.page + 1,
        from: pagination.skip,
        to: Math.min((pagination.skip + pagination.limit), docCount),
        last_page: Math.ceil(docCount / pagination.perPage),
        next_page_url: Math.ceil(docCount / pagination.perPage) > pagination.page + 1 ? pagination.nextPage : null,
        prev_page_url: pagination.prevPage
    }
}


exports.get_safe_update_obj = function (body, allowed_fields) {
    let response = {};
    allowed_fields.forEach(e => {
        if (body[e]) {
            response[e] = body[e];
        }
    });
    return response;
}

exports.deep_copy = obj => {
    let obc;
    if (!Array.isArray(obj)) {
        obc = { ...obj };
        for (const key in obc) {
            if (typeof obc[key] === 'object' || Array.isArray(obc[key])) {
                obc[key] = deep_copy(obc[key])
            }
        }
    } else {
        obc = [...obc];
        obc.forEach((v, i) => {
            if (typeof obc[i] === 'object' || Array.isArray(obc[i])) {
                obc[i] = deep_copy(obc[i])
            }
        })
    }
    return obc;
}
