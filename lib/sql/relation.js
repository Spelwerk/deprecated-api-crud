var async = require('async');

var query = require('./query'),
    ownership = require('./ownership');

module.exports.post = function(req, res, next, tableName, tableId, relationName, relationId, relationValue) {
    relationValue = relationValue || null;

    var affectedRows;

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
            query(sql, params, function(err, result) {
                if(err) return callback(err);

                affectedRows = result.affectedRows;

                callback();
            });
        }
    ],function(err) {
        if(err) return next(err);

        var message = 'Added relation:' + relationName + ' id: ' + relationId + ' to table: ' + tableName + ' row with id: ' + tableId;

        res.status(201).send({success: true, affected: affectedRows, message: message});
    });
};

module.exports.put = function(req, res, next, tableName, tableId, relationName, relationId, relationValue) {
    var changedRows;

    async.series([
        function(callback) {
            ownership(req, false, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableName + '_has_' + relationName + ' SET value = ? WHERE ' + tableName + '_id = ? AND ' + relationName + '_id = ?', [relationValue, tableId, relationId], function(err, result) {
                if(err) return callback(err);

                changedRows = result.changedRows;

                callback();
            });
        }
    ],function(err) {
        if(err) return next(err);

        var message = 'Changed relation: ' + relationName + ' id: ' + relationId + ' value to: ' + relationValue + ' in table: ' + tableName + ' row with id: ' + tableId;

        res.status(200).send({success: true, changed: changedRows, message: message});
    });
};

module.exports.delete = function(req, res, next, tableName, tableId, relationName, relationId) {
    var affectedRows;

    async.series([
        function(callback) {
            ownership(req, false, tableName, tableId, callback);
        },
        function(callback) {
            query('DELETE FROM ' + tableName + '_has_' + relationName + ' WHERE ' + tableName + '_id = ? AND ' + relationName + '_id = ?', [tableId, relationId], function(err, result) {
                if(err) return callback(err);

                affectedRows = result.affectedRows;

                callback();
            });
        }
    ],function(err) {
        if(err) return next(err);

        var message = 'Removed relation: ' + relationName + ' id: ' + relationId + ' from table: ' + tableName + ' row with id: ' + tableId;

        res.status(200).send({success: true, affected: affectedRows, message: message});
    });
};
