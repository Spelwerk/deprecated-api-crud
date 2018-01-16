'use strict';

const UserNotAllowedToEditError = require('../../lib/errors/user-not-allowed-to-edit-error');
const UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

const sql = require('./sql');

async function get(req, tableName, tableId) {
    if(!req.user.id) return new UserNotLoggedInError;

    try {
        tableId = parseInt(tableId);

        let user_has_table = 'user_has_' + tableName,
            table_id = tableName + '_id';

        let [rows] = await sql('SELECT * FROM ' + user_has_table + ' WHERE user_id = ? AND ' + table_id + ' = ?', [req.user.id, tableId]);

        let object = {};

        let row = rows[0];
        for(let key in row) {
            if(!row.hasOwnProperty(key)) continue;
            if(key.indexOf('_id') !== -1) continue;

            object[key] = row[key];
        }

        return object;
    } catch(e) {
        return e;
    }
}

async function verify(req, tableName, tableId) {
    if(!req.user.id) return new UserNotLoggedInError;

    if(req.user.admin) return;

    try {
        let object = await get(req.user, tableName, tableId);

        if(!object.owner && !object.edit) return new UserNotAllowedToEditError;
    } catch(e) {
        return e;
    }
}

async function keep(req, tableName, tableId) {
    if(!req.user.id) return new UserNotLoggedInError;

    try {
        tableId = parseInt(tableId);

        let user_has_table = 'user_has_' + tableName,
            table_id = tableName + '_id';

        return await sql('INSERT INTO ' + user_has_table + ' (user_id,' + table_id + ') VALUES (?,?)', [req.user.id, tableId]);
    } catch(e) {
        return e;
    }
}

async function favorite(req, tableName, tableId, boolean) {
    if(!req.user.id) return new UserNotLoggedInError;

    try {
        tableId = parseInt(tableId);
        boolean = !!boolean;

        let user_has_table = 'user_has_' + tableName,
            table_id = tableName + '_id';

        return await sql('UPDATE ' + user_has_table + ' SET favorite = ? WHERE user_id = ? AND ' + table_id + ' = ?', [boolean, req.user.id, tableId]);
    } catch(e) {
        return e;
    }
}

async function edit(req, tableName, tableId, userId, boolean) {
    if(!req.user.id) return new UserNotLoggedInError;

    try {
        tableId = parseInt(tableId);
        userId = parseInt(userId);
        boolean = !!boolean;

        let user_has_table = 'user_has_' + tableName,
            table_id = tableName + '_id';

        let object = await get(req.user, tableName, tableId);

        if(!object.owner) return new UserNotAllowedToEditError;

        return await sql('UPDATE ' + user_has_table + ' SET edit = ? WHERE user_id = ? AND ' + table_id + ' = ?', [boolean, userId, tableId]);
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.get = get;
module.exports.verify = verify;
module.exports.keep = keep;
module.exports.favorite = favorite;
module.exports.edit = edit;