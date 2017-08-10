var async = require('async');

var query = require('./query'),
    ownership = require('./ownership');

module.exports.post = function(req, res, next, tableName, tableId, relationName, relationId, relationValue) {
    relationValue = relationValue || null;

    var sql = relationValue !== null
        ? 'INSERT INTO ' + tableName + '_has_' + relationName + ' (' + tableName + '_id,' + relationName + '_id,value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value = VALUES(value)'
        : 'INSERT INTO ' + tableName + '_has_' + relationName + ' (' + tableName + '_id,' + relationName + '_id) VALUES (?,?)';

    var params = relationValue !== null
        ? [tableId, relationId, relationValue]
        : [tableId, relationId];

    async.series([
        function (callback) {
            ownership(req, false, tableName, tableId, callback);
        },
        function (callback) {
            query(sql, params, callback);
        }
    ],function(err) {
        if(err) return next(err);

        var message = environment === 'development' ? 'Added relation:' + relationName + ' id: ' + relationId + ' to table: ' + tableName + ' row with id: ' + tableId : null;

        res.status(201).send({success: true, message: message});
    });
};

module.exports.put = function(req, res, next, tableName, tableId, relationName, relationId, relationValue) {
    async.series([
        function(callback) {
            ownership(req, false, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableName + '_has_' + relationName + ' SET value = ? WHERE ' + tableName + '_id = ? AND ' + relationName + '_id = ?', [relationValue, tableId, relationId], callback);
        }
    ],function(err) {
        if(err) return next(err);

        var message = environment === 'development' ? 'Changed relation: ' + relationName + ' id: ' + relationId + ' value to: ' + relationValue + ' in table: ' + tableName + ' row with id: ' + tableId : null;

        res.status(200).send({success: true, message: message});
    });
};

module.exports.delete = function(req, res, next, tableName, tableId, relationName, relationId) {
    async.series([
        function(callback) {
            ownership(req, false, tableName, tableId, callback);
        },
        function(callback) {
            query('DELETE FROM ' + tableName + '_has_' + relationName + ' WHERE ' + tableName + '_id = ? AND ' + relationName + '_id = ?', [tableId, relationId], callback);
        }
    ],function(err) {
        if(err) return next(err);

        var message = environment === 'development' ? 'Removed relation: ' + relationName + ' id: ' + relationId + ' from table: ' + tableName + ' row with id: ' + tableId : null;

        res.status(200).send({success: true, message: message});
    });
};
