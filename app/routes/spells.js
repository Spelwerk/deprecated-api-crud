'use strict';

let AppError = require('../../lib/errors/app-error');

let async = require('async');

let generic = require('../../lib/helper/generic'),
    elemental = require('../../lib/sql/elemental'),
    query = require('../../lib/sql/query'),
    ownership = require('../../lib/sql/ownership');

module.exports = function(router) {
    const tableName = 'spell';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            let manifestation = {
                id: req.body.manifestation_id
            };

            let expertise = {
                id: req.body.expertise_id,
                name: req.body.name + ' Mastery',
                manifestation_id: req.body.manifestation_id
            };

            let spellId;

            async.series([
                function(callback) {
                    ownership(req.user, 'manifestation', manifestation.id, callback);
                },
                function(callback) {
                    if(!expertise.id) return callback();

                    ownership(req.user, 'expertise', expertise.id, callback);
                },
                function(callback) {
                    if(expertise.id) return callback();

                    query('SELECT skill_id AS id FROM skill_is_manifestation WHERE manifestation_id = ?', [manifestation.id], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback(new AppError(500, "Skill not found", "Skill not found", "Skill not found"));

                        expertise.skill_id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    if(expertise.id) return callback();

                    elemental.post(req.user, expertise, 'expertise', function(err, id) {
                        if(err) return callback(err);

                        req.body.expertise_id = id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, req.body, 'spell', function(err, id) {
                        if(err) return callback(err);

                        spellId = id;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: spellId});
            });
        });

    generic.deleted(router, tableName, sql);
    generic.schema(router, tableName);
    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);
};
