'use strict';

let async = require('async');

let query = require('../../lib/sql/query'),
    elemental = require('../../lib/sql/elemental'),
    generic = require('../../lib/helper/generic'),
    sequel = require('../../lib/helper/sequel');

module.exports = function(router) {
    const tableName = 'spelltype';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            let manifestationId = parseInt(req.body.manifestation_id);

            let expertise = {
                name: req.body.name + ' Mastery',
                description: req.body.description,
                skill_id: null,
            };

            let spellTypeId;

            async.series([
                function(callback) {
                    query('SELECT skill_id AS id FROM skill_is_manifestation WHERE manifestation_id = ?', [manifestationId], function(err, results) {
                        if(err) return callback(err);

                        expertise.skill_id = parseInt(results[0].id);

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, expertise, 'expertise', function(err, id) {
                        if(err) return callback(err);

                        req.body.expertise_id = id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, req.body, 'spelltype', function(err, id) {
                        if(err) return callback(err);

                        spellTypeId = id;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: spellTypeId});
            });
        });

    generic.deleted(router, tableName, sql);
    generic.schema(router, tableName);

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
