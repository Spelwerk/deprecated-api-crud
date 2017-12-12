'use strict';

let async = require('async');

let generic = require('../../lib/helper/generic'),
    elemental = require('../../lib/sql/elemental'),
    sequel = require('../../lib/helper/sequel');

module.exports = function(router) {
    const tableName = 'weapontype';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            let expertise = {
                name: req.body.name + ' Mastery',
                description: req.body.description,
                skill_id: req.body.skill_id,
                species_id: req.body.species_id
            };

            let weaponTypeId;

            req.body.equipable = !!req.body.augmentation || !!req.body.species_id;

            async.series([
                function(callback) {
                    elemental.post(req.user, expertise, 'expertise', function(err, id) {
                        if(err) return callback(err);

                        req.body.expertise_id = id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, req.body, 'weapontype', function(err, id) {
                        if(err) return callback(err);

                        weaponTypeId = id;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: weaponTypeId});
            });
        });

    generic.deleted(router, tableName, sql);
    generic.schema(router, tableName);

    router.route('/augmentation/:augmentation')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL AND ' +
                'augmentation = ?';

            sequel.get(req, res, next, call, [req.params.augmentation]);
        });

    router.route('/damage/:damageId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL AND ' +
                'attribute_id = ?';

            sequel.get(req, res, next, call, [req.params.damageId]);
        });

    router.route('/expertise/:expertiseId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL AND ' +
                'expertise_id = ?';

            sequel.get(req, res, next, call, [req.params.expertiseId]);
        });

    router.route('/species/:species')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL AND ' +
                'species = ?';

            sequel.get(req, res, next, call, [req.params.species]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);
};

//todo manifestation boolean
//todo form boolean