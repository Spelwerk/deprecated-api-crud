var async = require('async');

var query = require('./query'),
    ownership = require('./ownership');

module.exports.post = function(req, res, next, tableName, tableId, relationName, relationId, relationValue) {
    relationValue = relationValue || null;

    var tableHasRelation = tableName + '_has_' + relationName,
        table_Id = tableName + '_id',
        relation_Id = relationName + '_id';

    var sql = relationValue !== null
        ? 'INSERT INTO ' + tableHasRelation + ' (' + table_Id + ',' + relation_Id + ',value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value = VALUES(value)'
        : 'INSERT INTO ' + tableHasRelation + ' (' + table_Id + ',' + relation_Id + ') VALUES (?,?)';

    var params = relationValue !== null
        ? [tableId, relationId, relationValue]
        : [tableId, relationId];

    async.series([
        function(callback) {
            ownership(req, false, tableName, tableId, callback);
        },
        function(callback) {
            query(sql, params, callback);
        }
    ],function(err) {
        if(err) return next(err);

        res.status(201).send();
    });
};

module.exports.put = function(req, res, next, tableName, tableId, relationName, relationId, relationValue) {
    var tableHasRelation = tableName + '_has_' + relationName,
        table_Id = tableName + '_id',
        relation_Id = relationName + '_id';

    async.series([
        function(callback) {
            ownership(req, false, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableHasRelation + ' SET value = ? WHERE ' + table_Id + ' = ? AND ' + relation_Id + ' = ?', [relationValue, tableId, relationId], callback);
        }
    ],function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};

module.exports.delete = function(req, res, next, tableName, tableId, relationName, relationId) {
    var tableHasRelation = tableName + '_has_' + relationName,
        table_Id = tableName + '_id',
        relation_Id = relationName + '_id';

    async.series([
        function(callback) {
            ownership(req, false, tableName, tableId, callback);
        },
        function(callback) {
            query('DELETE FROM ' + tableHasRelation + ' WHERE ' + table_Id + ' = ? AND ' + relation_Id + ' = ?', [tableId, relationId], callback);
        }
    ],function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};
