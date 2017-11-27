'use strict';

var async = require('async');

var generic = require('../../lib/helper/generic'),
    elemental = require('../../lib/sql/elemental'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    var tableName = 'weapontype',
        options = { updatedField: true };

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var expertise = {
                name: req.body.name + ' Mastery',
                description: req.body.description,
                skill_id: req.body.skill_id,
                species_id: req.body.species_id
            };

            var equipable = !!req.body.augmentation || !!req.body.species_id;

            var weaponType = {
                name: req.body.name,
                description: req.body.description,
                icon: req.body.icon,
                attribute_id: req.body.attribute_id,
                augmentation: !!req.body.augmentation,
                species: !!req.body.species_id,
                equipable: equipable
            };

            async.series([
                function(callback) {
                    elemental.post(req.user, expertise, 'expertise', {userOwned: true, combinations: ['species']}, function(err, id) {
                        if(err) return callback(err);

                        weaponType.expertise_id = id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, weaponType, 'weapontype', {userOwned: true}, function(err, id) {
                        if(err) return callback(err);

                        weaponType.id = id;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: weaponType.id});
            });
        });

    generic.deleted(router, tableName, sql);

    router.route('/augmentation/:augmentation')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'augmentation = ?';

            sequel.get(req, res, next, call, [req.params.augmentation]);
        });

    router.route('/damage/:damageId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'attribute_id = ?';

            sequel.get(req, res, next, call, [req.params.damageId]);
        });

    router.route('/expertise/:expertiseId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'expertise_id = ?';

            sequel.get(req, res, next, call, [req.params.expertiseId]);
        });

    router.route('/species/:species')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'species = ?';

            sequel.get(req, res, next, call, [req.params.species]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);
    generic.delete(router, tableName, options);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.permissions(router, tableName);
    generic.revive(router, tableName);
};

//todo manifestation boolean
//todo form boolean