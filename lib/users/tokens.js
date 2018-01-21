'use strict';

const UserNotFoundError = require('../errors/user-not-found-error');

const sql = require('../database/sql');
const tokens = require('../tokens');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

async function getEmailById(id) {
    try {
        id = parseInt(id);

        let [rows] = await sql('SELECT email FROM user WHERE id = ?', [id]);
        if(rows.length === 0) return new UserNotFoundError;

        return rows[0].email;
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function generate(id, body) {
    try {
        id = parseInt(id);

        let browser = body.browser || null;
        let ip = body.ip || null;
        let os = body.os || null;

        let email = await getEmailById(id);
        let token = tokens.encode(email);

        let query = 'INSERT INTO user_token (user_id,token,browser,ip,os) VALUES (?,?,?,?,?)';
        let array = [id, token, browser, ip, os];

        await sql(query, array);

        return token;
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.generate = generate;
