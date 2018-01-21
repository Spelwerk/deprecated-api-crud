
const UserExpiredTimeoutError = require('../errors/user-expired-timeout-error');
const UserInvalidPasswordError = require('../errors/user-invalid-password-error');
const UserInvalidSecretError = require('../errors/user-invalid-secret-error');
const UserNotFoundError = require('../errors/user-not-found-error');
const UserPasswordNotSetError = require('../errors/user-password-not-set-error');

const nconf = require('nconf');
const moment = require('moment');

const sql = require('../database/sql');
const tokens = require('./tokens');
const mailgun = require('../mailgun');
const onion = require('../onion');
const hasher = require('../hasher');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function password(req) {
    try {
        let email = req.body.email.toString().toLowerCase();
        let password = req.body.password;

        let [rows] = await sql('SELECT id,password FROM user WHERE LOWER(email) = ?', [email]);
        if(rows.length === 0) return new UserNotFoundError;
        if(rows[0].password === null) return new UserPasswordNotSetError;

        let id = rows[0].id;
        let comparison = rows[0].password;

        let success = await onion.compare(password, comparison);
        if(!success) return UserInvalidPasswordError;

        let token = await tokens.generate(id, req.body);

        return { id: id, token: token };
    } catch(e) {
        return e;
    }
}

async function email(req) {
    try {
        let email = req.body.email.toString().toLowerCase();
        let secret = hasher(200);
        let timeout = moment().add(nconf.get('timeouts:user:login:amount'), nconf.get('timeouts:user:login:time')).format("YYYY-MM-DD HH:mm:ss");

        let [rows] = await sql('SELECT id FROM user WHERE LOWER(email) = ?', [email]);
        if(rows.length === 0) throw new UserNotFoundError;

        let id = rows[0].id;
        let query = 'INSERT INTO user_login (user_id,secret,timeout) VALUES (?,?,?)';
        let array = [id, secret, timeout];

        await sql(query, array);

        let payload = require('../templates/user-login')(secret, timeout);
        await mailgun(email, "Login Request", payload);
    } catch(e) {
        throw e;
    }
}

async function validate(req) {
    try {
        let secret = req.body.secret;

        let [rows] = await sql('SELECT user_id,timeout FROM user_login WHERE secret = ?', [secret]);
        if(rows.length === 0) return new UserInvalidSecretError(secret);

        let id = rows[0].user_id;
        let timeout = rows[0].timeout;
        let now = moment();

        if(timeout.isAfter(now)) return new UserExpiredTimeoutError(now, timeout);

        let token = await tokens.generate(id, req.body);

        await sql('DELETE FROM user_login WHERE user_id = ?', [id]);

        return { id: id, token: token };
    } catch(e) {
        throw e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.password = password;
module.exports.email = email;
module.exports.validate = validate;
