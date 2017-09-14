var async = require('async');

var query = require('./query'),
    ownership = require('./ownership');

module.exports.post = function(req, res, next, genericId, relationId, relationValue, relationCustom) {
    genericId = parseInt(genericId);
    relationId = parseInt(relationId);

    relationValue = relationValue || null;
    relationCustom = relationCustom || null;

    var sql = 'INSERT INTO generic_has_generic (generic_id,relation_id,value,custom) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE value = VALUES(value), custom = VALUES(custom)',
        params = [genericId, relationId, relationValue, relationCustom];

    async.series([
        function(callback) {
            ownership(req, genericId, callback);
        },
        function(callback) {
            query(sql, params, callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(201).send();
    });
};

module.exports.put = function(req, res, next, genericId, relationId, relationValue, relationCustom) {
    genericId = parseInt(genericId);
    relationId = parseInt(relationId);

    relationValue = relationValue || null;
    relationCustom = relationCustom || null;

    var sql = 'UPDATE generic_has_generic SET value = ?, custom = ? WHERE generic_id = ? AND relation_id = ?',
        params = [relationValue, relationCustom, genericId, relationId];

    async.series([
        function(callback) {
            ownership(req, genericId, callback);
        },
        function(callback) {
            query(sql, params, callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};

module.exports.delete = function(req, res, next, genericId, relationId) {
    genericId = parseInt(genericId);
    relationId = parseInt(relationId);

    var sql = 'DELETE FROM generic_has_generic WHERE generic_id = ? AND relation_id = ?',
        params = [genericId, relationId];

    async.series([
        function(callback) {
            ownership(req, genericId, callback);
        },
        function(callback) {
            query(sql, params, callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};
