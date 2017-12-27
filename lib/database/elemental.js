'use strict';

const UserNotAdministratorError = require('../../lib/errors/user-not-administrator-error');
const UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

const getSchema = require('../../app/initializers/database').getSchema;
const sql = require('./sql');
const combinations = require('./combinations');
const permissions = require('./permissions');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

async function insertIntoTable(user, body, tableName) {
    let schema = getSchema(tableName);

    try {
        let query = 'INSERT INTO ' + tableName + '(user_id,',
            values = ' VALUES (?,',
            array = [user.id];

        for(let key in body) {
            if(!body.hasOwnProperty(key)) continue;
            if(body[key] === '') continue;
            if(body[key] === undefined) continue;
            if(schema.fields.accepted.indexOf(key) === -1) continue;

            query += key + ',';
            values += '?,';
            array.push(values[key]);
        }

        query = query.slice(0, -1) + ')';
        values = values.slice(0, -1) + ')';
        query += values;

        return await sql(query, array);
    } catch(e) {
        return e;
    }
}

async function insertExtraData(user, body, tableName, tableId) {
    let schema = getSchema(tableName);
    let array = schema.tables.withData;

    tableId = parseInt(tableId);

    try {
        for(let i in array) {
            let fields = schema.fields.extra[array[i]];

            let query = 'INSERT INTO ' + tableName + '(' + tableName + '_id',
                values = ' VALUES (?,',
                array = [tableId];

            for(let key in body) {
                if(!body.hasOwnProperty(key)) continue;
                if(body[key] === '') continue;
                if(body[key] === undefined) continue;
                if(fields.indexOf(key) === -1) continue;

                query += key + ',';
                values += '?,';
                array.push(values[key]);
            }

            if(array.length === 1) continue;

            query = query.slice(0, -1) + ')';
            values = values.slice(0, -1) + ')';
            query += values;

            await sql(query, array);
        }

        return null;
    } catch(e) {
        return e;
    }
}

async function insertUserOwner(user, tableName, tableId) {
    let schema = getSchema(tableName);

    if(schema.security.user) return null;

    try {
        return await sql('INSERT INTO user_has_' + tableName + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,?)', [user.id, tableId, 1]);
    } catch(e) {
        return e;
    }
}

async function updateTable(user, body, tableName, tableId) {
    let schema = getSchema(tableName);

    try {
        let query = 'UPDATE ' + tableName + ' SET ',
            array = [];

        for(let key in body) {
            if(!body.hasOwnProperty(key)) continue;
            if(body[key] === '') continue;
            if(body[key] === undefined) continue;
            if(schema.fields.accepted.indexOf(key) === -1) continue;

            query += key + ' = ?,';
            array.push(body[key]);
        }

        if(array.length === 0) return null;

        if(schema.fields.updated) query += ' updated = CURRENT_TIMESTAMP,';

        query = query.slice(0, -1) + ' WHERE id = ?';
        array.push(tableId);

        return await sql(query, array);
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(user, body, tableName) {
    let schema = getSchema(tableName);

    if(schema.security.user && !user.id) return new UserNotLoggedInError;
    if(schema.security.admin && !user.admin) return new UserNotAdministratorError;

    try {
        let [id] = insertIntoTable(user, body, tableName, schema);

        await combinations.multiple(tableName, id, schema.tables.isOne, body);

        await insertExtraData(user, body, tableName, id);

        await insertUserOwner(user, tableName, id);

        return id;
    } catch(e) {
        return e;
    }
}

async function update(user, body, tableName, tableId) {
    let schema = getSchema(tableName);

    if(schema.security.user && !user.id) return new UserNotLoggedInError;
    if(schema.security.admin && !user.admin) return new UserNotAdministratorError;

    try {
        tableId = parseInt(tableId);

        await permissions.verify(user, tableName, tableId);

        await updateTable(user, body, tableName, tableId);

        await combinations.multiple(tableName, tableId, schema.tables.isOne, body);

        return null;
    } catch(e) {
        return e;
    }
}

async function remove(user, tableName, tableId) {
    let schema = getSchema(tableName);

    if(schema.security.user && !user.id) return new UserNotLoggedInError;
    if(schema.security.admin && !user.admin) return new UserNotAdministratorError;

    try {
        tableId = parseInt(tableId);

        await permissions.verify(user, tableName, tableId);

        await sql('UPDATE ' + tableName + ' SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [tableId])

        return null;
    } catch(e) {
        return e;
    }
}

async function clone(user, tableName, tableId) {
    let schema = getSchema(tableName);

    if(schema.security.user && !user.id) return new UserNotLoggedInError;
    if(schema.security.admin && !user.admin) return new UserNotAdministratorError;

    try {
        tableId = parseInt(tableId);


    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
module.exports.update = update;
module.exports.remove = remove;
module.exports.clone = clone;
