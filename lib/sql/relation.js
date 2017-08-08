var async = require('async');

var logger = require(appRoot + '/lib/logger'),
    sequel = require(appRoot + '/lib/sql/sequel'),
    auth = require(appRoot + '/lib/sql/auth');

exports.post = function(req, tableName, tableId, relationName, relationId, callback) {
    async.series([
        function (callback) {
            auth.ownership(req, false, tableName, tableId, callback);
        },
        function (callback) {
            sequel.query('INSERT INTO ' + tableName + '_has_' + relationName + ' (' + tableName + '_id,' + relationName + '_id) VALUES (?,?)', [parseInt(tableId), parseInt(relationId)], callback);
        }
    ],function(err) {
        callback(err);
    });
};

exports.postValue = function(req, tableName, tableId, relationName, relationId, relationValue, callback) {
    async.series([
        function (callback) {
            auth.ownership(req, false, tableName, tableId, callback);
        },
        function (callback) {
            sequel.query('INSERT INTO ' + tableName + '_has_' + relationName + ' (' + tableName + '_id,' + relationName + '_id,value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [parseInt(tableId), parseInt(relationId), parseInt(relationValue)], callback);
        }
    ],function(err) {
        callback(err);
    });
};

exports.put = function(req, tableName, tableId, relationName, relationId, relationValue, callback) {
    async.series([
        function(callback) {
            auth.ownership(req, false, tableName, tableId, callback);
        },
        function(callback) {
            sequel.query('UPDATE ' + tableName + '_has_' + relationName + ' SET value = ? WHERE ' + tableName + '_id = ? AND ' + relationName + '_id = ?', [parseInt(relationValue), parseInt(tableId), parseInt(relationId)], callback);
        }
    ],function(err) {
        callback(err);
    });
};

exports.delete = function(req, tableName, tableId, relationName, relationId, callback) {
    async.series([
        function(callback) {
            auth.ownership(req, false, tableName, tableId, callback);
        },
        function(callback) {
            sequel.query('DELETE FROM ' + tableName + '_has_' + relationName + ' WHERE ' + tableName + '_id = ? AND ' + relationName + '_id = ?', [parseInt(tableId), parseInt(relationId)], callback);
        }
    ],function(err) {
        callback(err);
    });
};
