'use strict';

const UserNotAdministratorError = require('../../lib/errors/user-not-administrator-error');
const UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

const sql = require('./sql');

async function insert(req, tableName, name, adminRestriction) {
    try {
        if(!req.user.id) return new UserNotLoggedInError;

        adminRestriction = !!adminRestriction;

        if(adminRestriction && !req.user.admin) return new UserNotAdministratorError;

        name = name.toLowerCase();

        let id;

        let [rows] = await sql('SELECT id FROM ' + tableName + ' WHERE LOWER(name) = ?', [name]);

        if(rows.length !== 0) {
            id = rows[0].id;
        } else {
            id = await sql('INSERT INTO ' + tableName + ' (name) VALUES (?)', [name]);
        }

        return id;
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;