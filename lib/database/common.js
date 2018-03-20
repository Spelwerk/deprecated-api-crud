'use strict';

const UserNotAdministratorError = require('../../lib/errors/user-not-administrator-error');
const UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

const getSchema = require('../../app/initializers/database').getSchema;

const sql = require('./sql');
const combination = require('./combination');
const permission = require('./permission');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

async function insertIntoTable(req, body, tableName) {
    let schema = getSchema(tableName);

    try {
        let query = 'INSERT INTO ' + tableName + '(user_id,';
        let values = ' VALUES (?,';
        let array = [req.user.id];

        for (let key in body) {
            if (!body.hasOwnProperty(key)) continue;
            if (schema.fields.accepted.indexOf(key) === -1) continue;

            query += key + ',';
            values += '?,';
            array.push(body[key]);
        }

        query = query.slice(0, -1) + ')';
        values = values.slice(0, -1) + ')';
        query += values;

        return await sql(query, array);
    } catch(e) { return e; }
}

async function insertExtraData(req, body, tableName, tableId) {
    try {
        tableId = parseInt(tableId);

        let schema = getSchema(tableName);
        let list = schema.tables.withData;

        for (let i in list) {
            let withName = list[i];
            let fields = schema.fields.extra[withName];

            let query = 'INSERT INTO ' + tableName + '_with_' + withName + ' (' + tableName + '_id,';
            let values = ' VALUES (?,';
            let array = [tableId];

            for (let key in body) {
                if (!body.hasOwnProperty(key)) continue;
                if (fields.indexOf(key) === -1) continue;

                query += key + ',';
                values += '?,';
                array.push(body[key]);
            }

            if (array.length === 1) continue;

            query = query.slice(0, -1) + ')';
            values = values.slice(0, -1) + ')';
            query += values;

            await sql(query, array);
        }
    } catch(e) { throw e; }
}

async function insertUserOwner(req, tableName, tableId) {
    let schema = getSchema(tableName);

    if (!schema.security.user) return null;

    try {
        await sql('INSERT INTO user_has_' + tableName + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,?)', [req.user.id, tableId, 1]);
    } catch(e) { throw e; }
}

async function updateTable(req, body, tableName, tableId) {
    let schema = getSchema(tableName);

    try {
        let query = 'UPDATE ' + tableName + ' SET ',
            array = [];

        for (let key in body) {
            if (!body.hasOwnProperty(key)) continue;
            if (schema.fields.accepted.indexOf(key) === -1) continue;

            query += key + ' = ?,';
            array.push(body[key]);
        }

        if (array.length === 0) return null;

        if (schema.fields.updated) query += ' updated = CURRENT_TIMESTAMP,';

        query = query.slice(0, -1) + ' WHERE id = ?';
        array.push(tableId);

        await sql(query, array);
    } catch(e) { throw e; }
}

async function populateBodyWithCombinations(body, tableName, tableId, schema) {
    let table_id = tableName + '_id';

    let array = schema.tables.isOne;

    for (let i in array) {
        let combinationName = array[i];
        let table_has_combination = tableName + '_is_' + combinationName;
        let combination_id = combinationName + '_id';

        let [rows] = await sql('SELECT * FROM ' + table_has_combination + ' WHERE ' + table_id + ' = ?', [tableId]);

        if (rows && rows.length !== 0) {
            body[combination_id] = rows[0][combination_id];
        }
    }

    return body;
}

async function populateBodyWithExtraData(body, tableName, tableId, schema) {
    let table_id = tableName + '_id';

    try {
        let array = schema.tables.withData;

        for (let i in array) {
            let table_with_extra = tableName + '_with_' + array[i];

            let [rows] = await sql('SELECT * FROM ' + table_with_extra + ' WHERE ' + table_id + ' = ?', [tableId]);

            if (rows.length !== 0) {
                let values = rows[0];

                for (let key in values) {
                    if (!values.hasOwnProperty(key)) continue;
                    if (key === table_id) continue;

                    body[key] = values[key];
                }
            }
        }

        return body;
    } catch(e) { return e; }
}

async function cloneRelations(tableName, tableId, cloneId, schema) {
    let table_id = tableName + '_id';

    try {
        let array = schema.tables.hasMany;

        for (let i in array) {
            let relationName = array[i];
            let table_has_relation = tableName + '_has_' + relationName;

            let [rows, fields] = await sql('SELECT * FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ?', [tableId]);

            if (rows && rows.length !== 0) {
                let query = 'INSERT INTO ' + table_has_relation + ' (';
                let values = ' VALUES ';
                let list = [];

                // Loop cols and add field name to the SQL String
                for (let i in fields) {
                    let fieldName = i;

                    if (fieldName === 'id') continue;

                    query += fieldName + ',';
                }

                // Loop body/results and add field values to the String
                for (let i in rows) {
                    if (!rows.hasOwnProperty(i)) continue;

                    let row = rows[i];

                    values += '(';

                    // Loop row and copy value to the String
                    // Do not copy original tableId, insert newId instead
                    for (let key in row) {
                        if (!row.hasOwnProperty(key)) continue;
                        if (key === 'id') continue;

                        values += '?,';

                        if (key.indexOf(table_id) !== -1) {
                            list.push(cloneId);
                        } else {
                            list.push(row[key]);
                        }
                    }

                    values = values.slice(0, -1) + '),';
                }

                query = query.slice(0, -1) + ')';
                values = values.slice(0, -1);

                query += values;

                await sql(query, list);
            }
        }
    } catch(e) { throw e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, body, tableName) {
    let schema = getSchema(tableName);

    if (schema.security.user && !req.user.id) return new UserNotLoggedInError;
    if (schema.security.admin && !req.user.admin) return new UserNotAdministratorError;

    try {
        let id = await insertIntoTable(req, body, tableName);

        await combination.multiple(tableName, id, schema.tables.isOne, body);
        await insertExtraData(req, body, tableName, id);
        await insertUserOwner(req, tableName, id);

        return id;
    } catch(e) { return e; }
}

async function update(req, body, tableName, tableId) {
    let schema = getSchema(tableName);

    if (schema.security.user && !req.user.id) return new UserNotLoggedInError;
    if (schema.security.admin && !req.user.admin) return new UserNotAdministratorError;

    try {
        tableId = parseInt(tableId);

        await permission.verify(req, tableName, tableId);
        await updateTable(req, body, tableName, tableId);
        await combination.multiple(tableName, tableId, schema.tables.isOne, body);

        return null;
    } catch(e) { return e; }
}

async function remove(req, tableName, tableId) {
    let schema = getSchema(tableName);

    if (schema.security.user && !req.user.id) return new UserNotLoggedInError;
    if (schema.security.admin && !req.user.admin) return new UserNotAdministratorError;

    try {
        tableId = parseInt(tableId);

        await permission.verify(req, tableName, tableId);
        await sql('UPDATE ' + tableName + ' SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [tableId])

        return null;
    } catch(e) { return e; }
}

async function clone(req, tableName, tableId) {
    let schema = getSchema(tableName);

    if (schema.security.user && !req.user.id) return new UserNotLoggedInError;
    if (schema.security.admin && !req.user.admin) return new UserNotAdministratorError;

    try {
        tableId = parseInt(tableId);

        let [rows] = await sql('SELECT * FROM ' + tableName + ' WHERE id = ?', [tableId]);
        let body = rows[0];

        // SELECT Combination Relations into body
        body = await populateBodyWithCombinations(body, tableName, tableId, schema);

        // SELECT Extra Data into body
        body = await populateBodyWithExtraData(body, tableName, tableId, schema);

        // CREATE new row in table
        let cloneId = await insert(req, body, tableName);

        // COPY Has Relations
        await cloneRelations(tableName, tableId, cloneId, schema);

        // Create copy combination relation
        await combination.single(tableName, cloneId, 'copy', tableId);

        return cloneId;
    } catch(e) { return e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
module.exports.update = update;
module.exports.remove = remove;
module.exports.clone = clone;
