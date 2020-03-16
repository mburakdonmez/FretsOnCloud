const { conn, mongoose } = require('./connection');
// const bcrypt = require('bcrypt'); // for future use
const Schema = mongoose.Schema;

const user_schema = Schema({
    email: { type: String, required: true },
    fullName: { type: String, required: true },
    // password: { type: String, required: false }, // for future use
    image: { type: String, required: false },
    google: { type: Boolean, default: false },
    google_id: { type: String, required: false },
    created_at: { type: Date, default: new Date },
    completed: { type: Boolean, default: false },
    nickName: {type: String, required: this.completed}
})

user_schema.index({ email: 1 }, { unique: true });
user_schema.index({ fullName: 1 }, { unique: true });

const user_model = conn.model('users', user_schema);

exports.schema = user_schema;
exports.model = user_model;


exports.create_user = function (email, fullName, password, image, callback = (err, res) => { }) {
    let user = new user_model({
        email: email,
        fullName: fullName,
        password: password,
        image: image,
    });
    user.save(callback);
}

exports.find_or_create = function (user_obj, callback = (err, res) => { }) {
    if (user_obj.emails && user_obj.emails.length > 0 && user_obj.emails[0].value) {
        const email = user_obj.emails[0].value;
        let user_obj_local = {
            email: email
        }
        user_model.findOne(user_obj_local, (err, res) => {
            if (err) {
                callback(err);
            } else {
                if (res) {
                    if (res[user_obj.provider] === true && res[`${user_obj.provider}_id`] === user_obj.id) {
                        callback(err, res);
                    } else {
                        let platforms = [];
                        if (res.google) {
                            platforms.push('Google');
                        }
                        callback(null, false, { message: `User registered with platform(s): ${platforms.join(', ')}` });
                    }
                } else {

                    let create_user = {
                        ...user_obj_local,
                        fullName: user_obj.displayName ? user_obj.displayName : user_obj.username
                    }
                    create_user[user_obj.provider] = true;
                    create_user[`${user_obj.provider}_id`] = user_obj.id
                    if (Array.isArray(user_obj.photos) && user_obj.photos.length > 0) {
                        create_user.image = user_obj.photos[0].value;
                    }
                    let user = new user_model(create_user);
                    user.save(callback);
                }
            }
        })
    } else {
        callback(new Error('email is required'));
    }

}

exports.edit_user = function () {

} // TODO
