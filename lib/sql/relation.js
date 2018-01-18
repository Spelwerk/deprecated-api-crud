'use strict';

const async = require('async');
const query = require('./query');
const ownership = require('./ownership');
const getSchema = require('../database/schema');

/**
 * Creates a row in a relation table
 * @deprecated
 * @param user Object
 * @param tableName String
 * @param tableId Integer
 * @param relationName String
 * @param relationId Integer
 * @param body Object
 * @param ignoredFields Array
 * @param callback
 * @returns callback(err)
 */
function post(user, tableName, tableId, relationName, relationId, body, ignoredFields, callback) {
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

    async.series([
        function(callback) {
            ownership(user, tableName, tableId, callback);
        },
        function(callback) {
            let sql = 'INSERT INTO ' + table_has_relation + ' (' + table_id + ',' + relation_id + ',',
                values = ' VALUES (?,?,',
                duplicate = ' ON DUPLICATE KEY UPDATE ',
                array = [tableId, relationId];

            for(let key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    if(ignoredFields.indexOf(key) !== -1) continue;
                    if(schema.fields.accepted.indexOf(key) === -1) continue;

                    sql += key + ',';
                    values += '?,';
                    duplicate += key + ' = VALUES(' + key + '),';
                    array.push(body[key]);
                    moreValuesAdded = true;
                }
            }

            sql = sql.slice(0, -1) + ')';
            values = values.slice(0, -1) + ')';
            duplicate = duplicate.slice(0, -1);

            sql += values;

            if(moreValuesAdded) sql += duplicate;

            query(sql, array, callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Edits a row in a relation table
 * @deprecated
 * @param user Object
 * @param tableName String
 * @param tableId Integer
 * @param relationName String
 * @param relationId Integer
 * @param body Object
 * @param ignoredFields Array
 * @param callback
 * @returns callback(err)
 */
function put(user, tableName, tableId, relationName, relationId, body, ignoredFields, callback) {
    tableId = parseInt(tableId);
    relationId = parseInt(relationId);
    ignoredFields = ignoredFields || [];

    let table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id',
        moreValuesAdded = false;

    let schema = getSchema(tableName);

    ignoredFields.push(table_id);
    ignoredFields.push(relation_id);

    async.series([
        function(callback) {
            ownership(user, tableName, tableId, callback);
        },
        function(callback) {
            let sql = 'UPDATE ' + table_has_relation + ' SET ',
                array = [];

            for(let key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    if(ignoredFields.indexOf(key) !== -1) continue;
                    if(schema.fields.accepted.indexOf(key) === -1) continue;

                    sql += key + ' = ?,';
                    array.push(body[key]);
                    moreValuesAdded = true;
                }
            }

            if(array.length === 0 && !moreValuesAdded) return callback();

            sql = sql.slice(0, -1) + ' WHERE ' + table_id + ' = ? AND ' + relation_id + ' = ?';
            array.push(tableId);
            array.push(relationId);

            query(sql, array, callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Removes a row from a relation table
 * @deprecated
 * @param user Object
 * @param tableName String
 * @param tableId Integer
 * @param relationName String
 * @param relationId Integer
 * @param callback
 * @returns callback(err)
 */
function remove(user, tableName, tableId, relationName, relationId, callback) {
    tableId = parseInt(tableId);
    relationId = parseInt(relationId);

    let table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id';

    async.series([
        function(callback) {
            ownership(user, tableName, tableId, callback);
        },
        function(callback) {
            query('DELETE FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ? AND ' + relation_id + ' = ?', [tableId, relationId], callback);
        }
    ], function(err) {
        callback(err);
    });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.post = post;
module.exports.put = put;
module.exports.remove = remove;