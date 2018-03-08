
const UserExpiredTimeoutError = require('../errors/user-expired-timeout-error');
const UserInvalidEmailError = require('../errors/user-invalid-email-error');
const UserInvalidSecretError = require('../errors/user-invalid-secret-error');
const UserNotAdministratorError = require('../errors/user-not-administrator-error');
const UserNotLoggedInError = require('../errors/user-not-logged-in-error');

const nconf = require('nconf');
const moment = require('moment');

const sql = require('../database/sql');
const mailgun = require('../mailgun');
const onion = require('../onion');
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
        if (rows.length === 0) throw new UserInvalidEmailError;

        let id = rows[0].id;

        await sql('INSERT INTO user_password (user_id,secret,timeout) VALUES (?,?,?)', [id, secret, timeout]);

        let payload = require('../templates/user-reset-password')(secret, timeout);
        await mailgun(email, "Set Password Request", payload);
    } catch(e) { throw e; }
}

async function validate(req) {
    try {
        let secret = req.body.secret;

        let [rows] = await sql('SELECT user_id,timeout FROM user_password WHERE secret = ?', [secret]);
        if (rows.length === 0) return new UserInvalidSecretError(secret);

        let id = rows[0].user_id;
        let timeout = rows[0].timeout;
        let now = moment();

        if (timeout.isAfter(now)) return new UserExpiredTimeoutError(now, timeout);

        let password = await onion.hash(req.body.password);

        await sql('UPDATE user SET password = ? WHERE id = ?', [password, id]);

        await sql('DELETE FROM user_password WHERE user_id = ?', [id]);
    } catch(e) { throw e; }
}

async function remove(req, removeId) {
    removeId = parseInt(removeId);

    try {
        if (!req.user.id) throw new UserNotLoggedInError;
        if (!req.user.admin && req.user.id !== removeId) throw new UserNotAdministratorError;

        await sql('UPDATE user SET password = NULL WHERE id = ?', [removeId]);
    } catch(e) { throw e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.email = email;
module.exports.validate = validate;
module.exports.remove = remove;
