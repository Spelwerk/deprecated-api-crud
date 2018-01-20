'use strict';

const getSchema = require('../../app/initializers/database').getSchema;
const sql = require('./sql');
const permission = require('./permission');

async function insert(req, body, tableName, tableId, relationName, relationId, ignoredFields) {
    tableId = parseInt(tableId);
    relationId = parseInt(relationId);
    ignoredFields = ignoredFields || [];

    let table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id',
        moreValuesAdded = false;

    let schema = getSchema(table_has_relation);

    ignoredFields.push(table_id);
    ignoredFields.push(relation_id);

    try {
        await permission.verify(req, tableName, tableId);

        let query = 'INSERT INTO ' + table_has_relation + ' (' + table_id + ',' + relation_id + ',',
            values = ' VALUES (?,?,',
            duplicate = ' ON DUPLICATE KEY UPDATE ',
            array = [tableId, relationId];

        for(let key in body) {
            if(!body.hasOwnProperty(key)) continue;
            if(schema.fields.accepted.indexOf(key) === -1) continue;
            if(ignoredFields.indexOf(key) !== -1) continue;

            query += key + ',';
            values += '?,';
            duplicate += key + ' = VALUES(' + key + '),';
            array.push(body[key]);
            moreValuesAdded = true;
        }

        query = query.slice(0, -1) + ')';
        values = values.slice(0, -1) + ')';
        duplicate = duplicate.slice(0, -1);

        query += values;

        if(moreValuesAdded) query += duplicate;

        await sql(query, array);
    } catch(e) {
        return e;
    }
}

async function update(req, body, tableName, tableId, relationName, relationId, ignoredFields) {
    tableId = parseInt(tableId);
    relationId = parseInt(relationId);
    ignoredFields = ignoredFields || [];

    let table_has_relation = tableName + '_has_' + relationName;
    let table_id = tableName + '_id';
    let relation_id = relationName + '_id';

    let schema = getSchema(tableName);

    ignoredFields.push(table_id);
    ignoredFields.push(relation_id);

    try {
        await permission.verify(req, tableName, tableId);

        let query = 'UPDATE ' + table_has_relation + ' SET ',
            array = [];

        for(let key in body) {
            if(!body.hasOwnProperty(key)) continue;
            if(schema.fields.accepted.indexOf(key) === -1) continue;
            if(ignoredFields.indexOf(key) !== -1) continue;

            query += key + ' = ?,';
            array.push(body[key]);
        }

        query = query.slice(0, -1) + ' WHERE ' + table_id + ' = ? AND ' + relation_id + ' = ?';
        array.push(tableId);
        array.push(relationId);

        await sql(query, array);
    } catch(e) {
        return e;
    }
}

async function remove(req, tableName, tableId, relationName, relationId) {
    tableId = parseInt(tableId);
    relationId = parseInt(relationId);

    let table_has_relation = tableName + '_has_' + relationName;
    let table_id = tableName + '_id';
    let relation_id = relationName + '_id';

    try {
        await permission.verify(req, tableName, tableId);

        await sql('DELETE FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ? AND ' + relation_id + ' = ?', [tableId, relationId]);
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
