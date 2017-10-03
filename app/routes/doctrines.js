'use strict';

var async = require('async');

var generic = require('../../lib/helper/generic'),
    sequel = require('../../lib/sql/sequel'),
    query = require('../../lib/sql/query'),
    ownership = require('../../lib/sql/ownership'),
    expertises = require('../../lib/tables/expertises'),
    doctrines = require('../../lib/tables/doctrines');

module.exports = function(router) {
    var tableName = 'doctrine';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var dId,
                dName = req.body.name,
                dDescription = req.body.description,
                dIcon = req.body.icon,
                dEffects = req.body.effects;

            var mId = req.body.manifestation_id,
                sId;

            var eId,
                eName = req.body.name + ' Mastery';

            async.series([
                function(callback) {
                    ownership(req.user, 'manifestation', mId, callback);
                },
                function(callback) {
                    query('SELECT skill_id AS id FROM skill_is_manifestation WHERE manifestation_id = ?', [mId], function(err, results) {
                        if(err) return callback(err);

                        sId = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    expertises.post(req.user, eName, null, sId, mId, null, function(err, id) {
                        if(err) return callback(err);

                        eId = id;

                        callback();
                    });
                },
                function(callback) {
                    doctrines.post(req.user, dName, dDescription, dIcon, eId, mId, dEffects, function(err, id) {
                        if(err) return callback(err);

                        dId = id;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: dId});
            });
        });

    generic.deleted(router, tableName, sql);

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName, false, true);
    generic.delete(router, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.images(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);
};
