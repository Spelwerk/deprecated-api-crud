'use strict';

let DatabaseRowNotFoundError = require('../errors/database-row-not-found-error');

let async = require('async');

let query = require('../sql/query'),
    relation = require('../sql/relation'),
    points = require('./points');

/** @deprecated */
function getValueFromRelation(creatureId, relationName, relationId, callback) {
    let value,
        creature_has_relation = 'creature_has_' + relationName,
        relation_id = relationName + '_id';

    query('SELECT value FROM ' + creature_has_relation + ' WHERE creature_id = ? AND ' + relation_id + ' = ?', [creatureId, relationId], function(err, results) {
        if(err) return callback(err);

        if(results.length === 0) return callback(new DatabaseRowNotFoundError);

        value = parseInt(results[0].value);

        callback(null, value);
    });
}

/** @deprecated */
function post(req, res, next, creatureId, relationName, relationId) {
    let value = parseInt(req.body.value);

    async.series([
        function(callback) {
            relation.post(req.user, 'creature', creatureId, relationName, relationId, req.body, null, callback);
        },
        function(callback) {
            if(value === 0) return callback();

            points.calculate(req.user, creatureId, relationName, 0, value, callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(201).send();
    });
}

/** @deprecated */
function put(req, res, next, creatureId, relationName, relationId) {
    let value = parseInt(req.body.value),
        old;

    async.series([
        function(callback) {
            relation.put(req.user, 'creature', creatureId, relationName, relationId, req.body, null, callback);
        },
        function(callback) {
            if(value === 0) return callback();

            getValueFromRelation(creatureId, relationName, relationId, function(err, result) {
                if(err) return callback(err);

                value = result;

                callback();
            });
        },
        function(callback) {
            points.calculate(req.user, creatureId, relationName, old, value, callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
}

/** @deprecated */
function remove(req, res, next, creatureId, relationName, relationId) {
    let value;

    async.series([
        function(callback) {
            getValueFromRelation(creatureId, relationName, relationId, function(err, result) {
                if(err) return callback(err);

                value = result;

                callback();
            });
        },
        function(callback) {
            relation.remove(req.user, 'creature', creatureId, relationName, relationId, callback);
        },
        function(callback) {
            points.calculate(req.user, creatureId, relationName, value, 0, callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.post = post;
module.exports.put = put;
module.exports.remove = remove;