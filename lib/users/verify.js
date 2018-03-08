
const UserExpiredTimeoutError = require('../errors/user-expired-timeout-error');
const UserInvalidEmailError = require('../errors/user-invalid-email-error');
const UserInvalidSecretError = require('../errors/user-invalid-secret-error');

const nconf = require('nconf');
const moment = require('moment');

const sql = require('../database/sql');
const mailgun = require('../mailgun');
const hasher = require('../hasher');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function email(req) {
    try {
        let email = req.body.email.toString().toLowerCase();
        let secret = hasher(256);
        let timeout = moment().add(nconf.get('timeouts:user:verify:amount'), nconf.get('timeouts:user:verify:time')).format("YYYY-MM-DD HH:mm:ss");

        let [rows] = await sql('SELECT id FROM user WHERE LOWER(email) = ?', [email]);
        if (rows.length === 0) throw new UserInvalidEmailError;

        let id = rows[0].id;

        await sql('INSERT INTO user_verify (user_id,secret,timeout) VALUES (?,?,?)', [id, secret, timeout]);

        let payload = require('../templates/user-verify')(secret, timeout);
        await mailgun(email, "User Verification Request", payload);
    } catch(e) { throw e; }
}

async function validate(req) {
    try {
        let secret = req.body.secret;

        let [rows] = await sql('SELECT user_id,timeout FROM user_verify WHERE secret = ?', [secret]);
        if (rows.length === 0) return new UserInvalidSecretError(secret);

        let id = rows[0].user_id;
        let timeout = rows[0].timeout;
        let now = moment();

        if (timeout.isAfter(now)) return new UserExpiredTimeoutError(now, timeout);

        let firstName = req.body.firstname || null;
        let lastName = req.body.lastname || null;

        await sql('UPDATE user SET firstname = ?, lastname = ? WHERE id = ?', [firstName, lastName, id]);

        await sql('DELETE FROM user_verify WHERE user_id = ?', [id]);
    } catch(e) { throw e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.email = email;
module.exports.validate = validate;
