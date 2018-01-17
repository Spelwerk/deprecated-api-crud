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

async function insertIntoTable(req, body, tableName) {
    let schema = getSchema(tableName);

    try {
        let query = 'INSERT INTO ' + tableName + '(user_id,',
            values = ' VALUES (?,',
            array = [req.user.id];

        for(let key in body) {
            if(!body.hasOwnProperty(key)) continue;
            if(schema.fields.accepted.indexOf(key) === -1) continue;

            query += key + ',';
            values += '?,';
            array.push(body[key]);
        }

        query = query.slice(0, -1) + ')';
        values = values.slice(0, -1) + ')';
        query += values;

        return await sql(query, array);
    } catch(e) {
        return e;
    }
}

async function insertExtraData(req, body, tableName, tableId) {
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
                if(fields.indexOf(key) === -1) continue;

                query += key + ',';
                values += '?,';
                array.push(body[key]);
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

async function insertUserOwner(req, tableName, tableId) {
    let schema = getSchema(tableName);

    if(schema.security.user) return null;

    try {
        return await sql('INSERT INTO user_has_' + tableName + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,?)', [req.user.id, tableId, 1]);
    } catch(e) {
        return e;
    }
}

async function updateTable(req, body, tableName, tableId) {
    let schema = getSchema(tableName);

    try {
        let query = 'UPDATE ' + tableName + ' SET ',
            array = [];

        for(let key in body) {
            if(!body.hasOwnProperty(key)) continue;
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

async function insert(req, body, tableName) {
    let schema = getSchema(tableName);

    if(schema.security.user && !req.user.id) return new UserNotLoggedInError;
    if(schema.security.admin && !req.user.admin) return new UserNotAdministratorError;

    try {
        let id = await insertIntoTable(req, body, tableName);

        await combinations.multiple(tableName, id, schema.tables.isOne, body);
        await insertExtraData(req, body, tableName, id);
        await insertUserOwner(req, tableName, id);

        return id;
    } catch(e) {
        return e;
    }
}

async function update(req, body, tableName, tableId) {
    let schema = getSchema(tableName);

    if(schema.security.user && !req.user.id) return new UserNotLoggedInError;
    if(schema.security.admin && !req.user.admin) return new UserNotAdministratorError;

    try {
        tableId = parseInt(tableId);

        await permissions.verify(req, tableName, tableId);
        await updateTable(req, body, tableName, tableId);
        await combinations.multiple(tableName, tableId, schema.tables.isOne, body);

        return null;
    } catch(e) {
        return e;
    }
}

async function remove(req, tableName, tableId) {
    let schema = getSchema(tableName);

    if(schema.security.user && !req.user.id) return new UserNotLoggedInError;
    if(schema.security.admin && !req.user.admin) return new UserNotAdministratorError;

    try {
        tableId = parseInt(tableId);

        await permissions.verify(req, tableName, tableId);
        await sql('UPDATE ' + tableName + ' SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [tableId])

        return null;
    } catch(e) {
        return e;
    }
}

async function clone(req, tableName, tableId) {
    let schema = getSchema(tableName);

    if(schema.security.user && !req.user.id) return new UserNotLoggedInError;
    if(schema.security.admin && !req.user.admin) return new UserNotAdministratorError;

    try {
        tableId = parseInt(tableId);

        let table_id = tableName + '_id';

        let [rows] = await sql('SELECT * FROM ' + tableName + ' WHERE id = ?', [tableId]);
        let body = rows[0];

        // SELECT Combination Relations into body
        if(schema.tables.isOne.length !== 0) {
            let array = schema.tables.isOne;

            for(let i in array) {
                let combinationName = array[i];
                let table_has_combination = tableName + '_is_' + combinationName;
                let combination_id = combinationName + '_id';

                let [rows] = await sql('SELECT * FROM ' + table_has_combination + ' WHERE ' + table_id + ' = ?', [tableId]);

                if(rows && rows.length !== 0) {
                    body[combination_id] = rows[0][combination_id];
                }
            }
        }

        // SELECT Extra Data into body
        if(schema.tables.withData.length !== 0) {
            let array = schema.tables.withData;

            for(let i in array) {
                let tableWithName = array[i];

                let [rows] = await sql('SELECT * FROM ' + tableWithName + ' WHERE ' + table_id + ' = ?', [tableId]);

                if(rows && rows.length !== 0) {
                    let values = rows[0];

                    for(let key in values) {
                        if(!values.hasOwnProperty(key)) continue;
                        if(key === table_id) continue;

                        body[key] = values[key];
                    }
                }
            }
        }

        // CREATE new row in table
        let id = await insert(req, body, tableName);

        // COPY Has Relations
        if(schema.tables.hasMany.length !== 0) {
            let array = schema.tables.hasMany;

            for(let i in array) {
                let relationName = array[i];
                let table_has_relation = tableName + '_has_' + relationName;

                let [rows, fields] = await sql('SELECT * FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ?', [tableId]);

                if(rows && rows.length !== 0) {
                    let query = 'INSERT INTO ' + table_has_relation + ' (';
                    let values = ' VALUES ';
                    let list = [];

                    // Loop cols and add field name to the SQL String
                    for(let i in fields) {
                        let fieldName = i;

                        if(fieldName === 'id') continue;

                        query += fieldName + ',';
                    }

                    // Loop body/results and add field values to the String
                    for(let i in rows) {
                        if(!rows.hasOwnProperty(i)) continue;

                        let row = rows[i];

                        values += '(';

                        // Loop row and copy value to the String
                        // Do not copy original tableId, insert newId instead
                        for(let key in row) {
                            if(!row.hasOwnProperty(key)) continue;
                            if(key === 'id') continue;

                            values += '?,';

                            if(key.indexOf(table_id) !== -1) {
                                list.push(id);
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
        }

        // Create copy combination relation
        await combinations.single(tableName, id, 'copy', tableId);

        return id;
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
