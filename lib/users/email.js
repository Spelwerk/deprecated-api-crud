
const UserExpiredTimeoutError = require('../errors/user-expired-timeout-error');
const UserInvalidEmailError = require('../errors/user-invalid-email-error');
const UserInvalidSecretError = require('../errors/user-invalid-secret-error');

const nconf = require('nconf');
const moment = require('moment');

const sql = require('../database/sql');
const tokens = require('./tokens');
const mailgun = require('../mailgun');
const hasher = require('../hasher');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function email(req) {
    try {
        let email = req.body.email.toString().toLowerCase();
        let secret = hasher(200);
        let timeout = moment().add(nconf.get('timeouts:user:verify:amount'), nconf.get('timeouts:user:verify:time')).format("YYYY-MM-DD HH:mm:ss");

        let [rows] = await sql('SELECT id FROM user WHERE LOWER(email) = ?', [email]);
        if(rows.length === 0) throw new UserInvalidEmailError;

        let id = rows[0].id;

        await sql('INSERT INTO user_email (user_id,secret,timeout) VALUES (?,?,?)', [id, secret, timeout]);

        let payload = require('../templates/user-reset-email')(secret, timeout);
        await mailgun(email, "Email Change Request", payload);
    } catch(e) {
        throw e;
    }
}

async function validate(req) {
    try {
        let secret = req.body.secret;

        let [rows] = await sql('SELECT user_id,timeout FROM user_email WHERE secret = ?', [secret]);
        if(rows.length === 0) return new UserInvalidSecretError(secret);

        let id = rows[0].user_id;
        let timeout = rows[0].timeout;
        let now = moment();

        if(timeout.isAfter(now)) return new UserExpiredTimeoutError(now, timeout);

        let email = req.body.email;

        let [oRows] = await sql('SELECT email FROM user WHERE id = ?', [id]);
        let original = oRows[0].email;

        await sql('UPDATE user SET email = ? WHERE id = ?', [email, id]);

        await sql('DELETE FROM user_email WHERE user_id = ?', [id]);

        let payload = require('../templates/user-reset-email-confirmation')(email);
        await mailgun(email, "Email has changed", payload);
        await mailgun(original, "Email has changed", payload);

        let token = await tokens.generate(id, req.body);

        return { id: id, token: token };
    } catch(e) {
        throw e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.email = email;
module.exports.validate = validate;
