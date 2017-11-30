'use strict';

let async = require('async');

let generic = require('../../lib/helper/generic'),
    elemental = require('../../lib/sql/elemental'),
    sequel = require('../../lib/sql/sequel'),
    query = require('../../lib/sql/query'),
    ownership = require('../../lib/sql/ownership');

module.exports = function(router) {
    let tableName = 'doctrine';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            let manifestation = {
                id: req.body.manifestation_id
            };

            let expertise = {
                name: req.body.name + ' Mastery',
                manifestation_id: req.body.manifestation_id
            };

            let doctrine = {
                name: req.body.name,
                description: req.body.description,
                icon: req.body.icon,
                manifestation_id: req.body.manifestation_id,
                effects: req.body.effects
            };

            async.series([
                function(callback) {
                    ownership(req.user, 'manifestation', manifestation.id, callback);
                },
                function(callback) {
                    query('SELECT skill_id AS id FROM skill_is_manifestation WHERE manifestation_id = ?', [manifestation.id], function(err, results) {
                        if(err) return callback(err);

                        expertise.skill_id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, expertise, 'expertise', null, function(err, id) {
                        if(err) return callback(err);

                        doctrine.expertise_id = id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, doctrine, 'doctrine', null, function(err, id) {
                        if(err) return callback(err);

                        doctrine.id = id;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: doctrine.id});
            });
        });

    generic.deleted(router, tableName, sql);

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);
};
