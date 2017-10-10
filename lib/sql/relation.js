'use strict';

var async = require('async');

var query = require('./query'),
    ownership = require('./ownership');

module.exports.post = function(req, res, next, tableName, tableId, relationName, relationId, ignoredCols) {
    tableId = parseInt(tableId);
    relationId = parseInt(relationId);
    ignoredCols = ignoredCols || [];

    var table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id',
        moreValuesAdded = false;

    ignoredCols.push('insert_id');
    ignoredCols.push(table_id);
    ignoredCols.push(relation_id);

    async.series([
        function(callback) {
            ownership(req.user, tableName, tableId, callback);
        },
        function(callback) {
            var body = req.body,
                sql = 'INSERT INTO ' + table_has_relation + ' (' + table_id + ',' + relation_id + ',',
                values = ' VALUES (?,?,',
                duplicate = ' ON DUPLICATE KEY UPDATE ',
                array = [tableId, relationId];

            for(let key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    if(ignoredCols.indexOf(key) !== -1) continue;

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
        if(err) return next(err);

        res.status(201).send();
    });
};

module.exports.put = function(req, res, next, tableName, tableId, relationName, relationId, ignoredCols) {
    tableId = parseInt(tableId);
    relationId = parseInt(relationId);
    ignoredCols = ignoredCols || [];

    var table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id',
        moreValuesAdded = false;

    ignoredCols.push(table_id);
    ignoredCols.push(relation_id);

    async.series([
        function(callback) {
            ownership(req.user, tableName, tableId, callback);
        },
        function(callback) {
            var body = req.body,
                sql = 'UPDATE ' + table_has_relation + ' SET ',
                array = [];

            for(let key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    if(ignoredCols.indexOf(key) !== -1) continue;

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
        if(err) return next(err);

        res.status(204).send();
    });
};

module.exports.delete = function(req, res, next, tableName, tableId, relationName, relationId) {
    tableId = parseInt(tableId);
    relationId = parseInt(relationId);

    var table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id';

    async.series([
        function(callback) {
            ownership(req.user, tableName, tableId, callback);
        },
        function(callback) {
            query('DELETE FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ? AND ' + relation_id + ' = ?', [tableId, relationId], callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};
