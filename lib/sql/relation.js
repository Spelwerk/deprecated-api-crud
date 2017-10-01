var async = require('async');

var query = require('./query'),
    ownership = require('./ownership');

module.exports.post = function(req, res, next, tableName, tableId, relationName, relationId, relationValue) {
    relationValue = parseInt(relationValue) || null;

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
            var call = relationValue
                ? 'INSERT INTO ' + table_has_relation + ' (' + table_id + ',' + relation_id + ',value) VALUES (?,?,?)'
                : 'INSERT INTO ' + table_has_relation + ' (' + table_id + ',' + relation_id + ') VALUES (?,?)';

            var params = relationValue
                ? [tableId, relationId, relationValue]
                : [tableId, relationId];

            query(call, params, callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(201).send();
    });
};

module.exports.put = function(req, res, next, tableName, tableId, relationName, relationId, relationValue) {
    tableId = parseInt(tableId);
    relationId = parseInt(relationId);
    relationValue = parseInt(relationValue) || 0;

    var table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id';

    async.series([
        function(callback) {
            ownership(req.user, tableName, tableId, callback);
        },
        function(callback) {
            if(relationValue === 0) return callback();

            query('DELETE FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ? AND ' + relation_id + ' = ?', [tableId, relationId], callback);
        },
        function(callback) {
            if(relationValue !== 0) return callback();

            query('UPDATE ' + table_has_relation + ' SET value = ? WHERE ' + table_id + ' = ? AND ' + relation_id + ' = ?', [relationValue, tableId, relationId], callback);
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
