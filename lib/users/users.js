'use strict';

const UserNotAdministratorError = require('../errors/user-not-administrator-error');
const UserNotLoggedInError = require('../errors/user-not-logged-in-error');

const nconf = require('nconf');
const moment = require('moment');

const sql = require('../database/sql');
const mailgun = require('../mailgun');
const hasher = require('../hasher');

const tokens = require('./tokens');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req) {
    try {
        let email = req.body.email.toString().toLowerCase();
        let displayName = req.body.displayname;
        let secret = hasher(200);
        let timeout = moment().add(nconf.get('timeouts:user:verify:amount'), nconf.get('timeouts:user:verify:time')).format("YYYY-MM-DD HH:mm:ss");

        let id = await sql('INSERT INTO user (email,displayname) VALUES (?,?)', [email, displayName]);

        await sql('INSERT into user_verification (user_id,secret,timeout) VALUES (?,?,?', [id, secret, timeout]);

        let payload = require('../templates/user-post')(secret, timeout);
        await mailgun(email, "User Verification", payload);

        let token = await tokens.generate(id, req.body);

        return {id: id, token: token};
    } catch(e) { return e; }
}

async function update(req, updateId) {
    updateId = parseInt(updateId);

    try {
        if (!req.user.id) throw new UserNotLoggedInError;

        let displayName = req.body.displayname || null;
        let firstName = req.body.firstname || null;
        let lastName = req.body.lastname || null;

        if (!req.user.admin && req.user.id !== updateId) throw new UserNotAdministratorError;

        let query = 'UPDATE user SET displayname = ?, firstname = ?, lastname = ? WHERE id = ?';
        let array = [displayName, firstName, lastName, updateId];

        await sql(query, array);
    } catch(e) { throw e; }
}

async function remove(req, removeId) {
    removeId = parseInt(removeId);

    try {
        if (!req.user.id) throw new UserNotLoggedInError;
        if (!req.user.admin && req.user.id !== removeId) throw new UserNotAdministratorError;

        let email = 'DELETED{{' + removeId + '}}';
        let query = 'UPDATE user SET email = ?, admin = 0, verified = 0, password = NULL, displayname = NULL, firstname = NULL, lastname = NULL, deleted = CURRENT_TIMESTAMP WHERE id = ?';
        let array = [email];

        await sql(query, array);
    } catch(e) { throw e; }
}

async function admin(req, adminId) {
    adminId = parseInt(adminId);

    try {
        if (!req.user.id) throw new UserNotLoggedInError;
        if (!req.user.admin) throw new UserNotAdministratorError;

        let admin = parseInt(req.body.admin);

        await sql('UPDATE user SET admin = ? WHERE id = ?', [admin, adminId]);
    } catch(e) { throw e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
module.exports.update = update;
module.exports.remove = remove;
module.exports.admin = admin;
